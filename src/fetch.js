import Promise from 'bluebird';
import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import invariant from 'invariant';
import storeShape from 'react-redux/lib/utils/storeShape';
import { bindActionCreators } from 'redux';
import { prefetchInit, prefetchSuccess, prefetchError, prefetchReset } from './reducer.js';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function getStateDefault(store) {
  return store.getState().prefetching;
}

export default function fetch(_namespace, action, options = {}, getState = getStateDefault) {
  const namespace = `${_namespace}_fetching`;
  const { withRef = false } = options;

  function createWaitFor(store) {
    return function waitFor(dependency) {
      const state = getState(store)[`${dependency}_fetching`];
      if (!state) {
        return Promise.resolve();
      }

      return Promise.resolve(state.promise).then(() => {
        const result = getState(store)[`${dependency}_fetching`];
        if (result.error) {
          return Promise.reject(result.data);
        }

        return result.data;
      });
    };
  }

  function fetchData(store, params, state) {
    // shortcut
    if (state && state.fetching === false) {
      return Promise[state.error ? 'reject' : 'resolve'](state.data);
    }

    // this must either return a promise
    // or null, then it will be marked as resolved
    const promise = action({ ...store, waitFor: createWaitFor(store) }, params, state);

    // this allows us to wait in other handlers
    store.dispatch(prefetchInit(namespace, promise));

    // wait for the action to complete and emit success/error events
    return Promise.resolve(promise).reflect().then(data => {
      let act;
      let value;
      if (data.isFulfilled()) {
        act = prefetchSuccess;
        value = data.value();
      } else {
        act = prefetchError;
        value = data.reason();
      }

      store.dispatch(act(namespace, value));
      return value;
    });
  }

  return function wrapWithFetch(WrappedComponent) {
    class Fetch extends Component {

      static displayName = `Fetch(${getDisplayName(WrappedComponent)})`;

      static propTypes = {
        store: storeShape,
        params: PropTypes.object,
      };

      static contextTypes = {
        store: storeShape,
      };

      constructor(props, context) {
        super(props, context);
        this.store = props.store || context.store;
        this.prefetchReset = bindActionCreators(prefetchReset, this.store.dispatch);

        invariant(this.store,
          `Could not find "store" in either the context or ` +
          `props of "${this.constructor.displayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${this.constructor.displayName}".`
        );
      }

      componentDidMount() {
        fetchData(this.store, this.props.params, this.getFetchProps());
      }

      getFetchProps() {
        return getState(this.store)[namespace];
      }

      getWrappedInstance() {
        invariant(withRef,
          `To access the wrapped instance, you need to specify ` +
          `{ withRef: true } as the fourth argument of the connect() call.`
        );

        return this.refs.wrappedInstance;
      }

      static fetch = fetchData;
      static WrappedComponent = WrappedComponent;

      render() {
        const ref = withRef ? 'wrappedInstance' : null;
        return (
          <WrappedComponent {...this.props} fetch={this.getFetchProps()} prefetchReset={this.prefetchReset} ref={ref} />
        );
      }
    }

    return hoistStatics(Fetch, WrappedComponent);
  };
}
