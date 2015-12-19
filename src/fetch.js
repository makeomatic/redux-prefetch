import React, { Component, PropTypes } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import invariant from 'invariant';
import storeShape from 'react-redux/lib/utils/storeShape';
import { prefetchInit, prefetchSuccess, prefetchError } from './reducer.js';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function getStateDefault(store) {
  return store.getState().prefetching;
}

export default function fetch(namespace, action, options = {}, getState = getStateDefault) {
  const { withRef = false } = options;

  function fetchData(store, params) {
    const state = getState(store)[namespace];
    const result = action(store, params, state);

    if (!state) {
      store.dispatch(prefetchInit(namespace, result));
      return result.reflect().then(data => {
        let act;
        let value;
        if (data.isFulfilled()) {
          act = prefetchSuccess;
          value = data.value();
        } else {
          act = prefetchError;
          value = data.reason();
        }

        return store.dispatch(act(namespace, value));
      });
    }

    return result;
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

        invariant(this.store,
          `Could not find "store" in either the context or ` +
          `props of "${this.constructor.displayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${this.constructor.displayName}".`
        );
      }

      componentDidMount() {
        fetchData(this.store, this.props.params);
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
          <WrappedComponent {...this.props} ref={ref} />
        );
      }
    }

    return hoistStatics(Fetch, WrappedComponent);
  };
}
