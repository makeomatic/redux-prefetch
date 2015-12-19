import { createStore, applyMiddleware, compose } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import reducers from '../modules/reducers';
import { syncReduxAndRouter } from 'redux-simple-router';
import { canUseDOM as isBrowser } from 'fbjs/lib/ExecutionEnvironment';
import { reduxPrefetch } from '../redux-prefetch';

export default function returnStore(history, initialState) {
  const middleware = [promiseMiddleware()];

  let finalCreateStore;
  if (isBrowser) {
    finalCreateStore = applyMiddleware(...middleware);
  } else {
    finalCreateStore = compose(reduxPrefetch, applyMiddleware(...middleware));
  }

  const store = finalCreateStore(createStore)(reducers, initialState);
  syncReduxAndRouter(history, store);

  return store;
}
