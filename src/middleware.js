import Promise from 'bluebird';
import forOwn from 'lodash.forown';
import { applyMiddleware } from 'redux';
import { REDUX_PREFETCH_INIT, REDUX_PREFETCH_SUCCESS, REDUX_PREFETCH_ERROR } from './constants.js';//
const FILTER_ACTIONS = [REDUX_PREFETCH_INIT, REDUX_PREFETCH_SUCCESS, REDUX_PREFETCH_ERROR];

class AsyncResolver {
  constructor() {
    this.pendingActions = [];
    this.store = null;
  }

  resolve = (components, params) => {
    const { store } = this;
    return Promise
      .filter(components, component => component && typeof component.fetch === 'function')
      .map(component => component.fetch(store, params))
      .then(this.iteratePendingActions);
  }

  iteratePendingActions = () => {
    const { store, pendingActions } = this;

    const queue = [].concat(pendingActions);
    pendingActions.splice(0, pendingActions.length);

    return Promise.join(...queue)
      .reflect()
      .then(() => {
        if (pendingActions.length > 0) {
          return this.iteratePendingActions();
        }
      })
      .then(store.getState);
  }

  middleware() {
    const { pendingActions } = this;

    return store => next => action => { // eslint-line-ignore
      const resultingAction = next(action);
      if (FILTER_ACTIONS.indexOf(action.type) >= 0) {
        return resultingAction;
      }

      const promises = [];
      forOwn(resultingAction.payload, prop => {
        if (prop && typeof prop === 'object' && typeof prop.then === 'function') {
          promises.push(prop);
        }
      });

      if (promises.length > 0) {
        pendingActions.push(...promises);
        return Promise.join(...promises);
      }

      return resultingAction;
    };
  }
}

export default function initResolver(next) {
  return (reducer, initialState) => {
    const asyncResolver = new AsyncResolver();
    const store = applyMiddleware(asyncResolver.middleware())(next)(reducer, initialState);

    asyncResolver.store = store;
    store.resolve = asyncResolver.resolve;

    return {
      ...store,
    };
  };
}
