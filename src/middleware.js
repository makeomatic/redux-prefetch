import Promise from 'bluebird';
import forOwn from 'lodash.forown';
import { applyMiddleware } from 'redux';

class AsyncResolver {
  constructor() {
    this.pendingActions = [];
    this.store = null;
  }

  resolve(store) {
    this.store = store;

    return (components, params) => {
      return Promise
        .filter(components, component => component && typeof component.fetch === 'function')
        .then(filteredComponents => {
          return this.iterateOverComponents(filteredComponents, params);
        });
    };
  }

  iterateOverComponents = (filteredComponents, params) => {
    const { store, pendingActions } = this;

    return Promise
      .map(filteredComponents, component => {
        return component.fetch(store, params);
      })
      .then(() => {
        const queue = [].concat(pendingActions);
        pendingActions.splice(0, pendingActions.length);
        return Promise.join(...queue);
      })
      .reflect()
      .then(() => {
        if (pendingActions.length > 0) {
          return this.iterateOverComponents(filteredComponents, params);
        }
      })
      .then(store.getState);
  }

  middleware() {
    const { pendingActions } = this;

    return store => next => action => {
      const resultingAction = next(action);
      const promises = [];

      forOwn(resultingAction.payload, prop => {
        if (prop && typeof prop === 'object' && typeof prop.then === 'function') {
          promises.push(prop);
        }
      });

      if (promises.length > 0) {
        store.dispatch({
          type: `${action.type}_PROMISE`,
          payload: {
            promises,
          },
        });
        pendingActions.push(...promises);
      }

      return resultingAction;
    };
  }
}

export default function initResolver(next) {
  return (reducer, initialState) => {
    const asyncResolver = new AsyncResolver();
    const store = applyMiddleware(asyncResolver.middleware())(next)(reducer, initialState);
    store.resolve = asyncResolver.resolve(store);

    return {
      ...store,
    };
  };
}
