import { handleActions, createAction } from 'redux-actions';
import { REDUX_PREFETCH_INIT, REDUX_PREFETCH_SUCCESS, REDUX_PREFETCH_ERROR, REDUX_PREFETCH_RESET } from './constants.js';

const initialState = {

};

function getProp(action) {
  return action.payload.namespace;
}

export default handleActions({
  [REDUX_PREFETCH_RESET]: (state, action) => ({
    ...state,
    [action.payload]: undefined,
  }),

  [REDUX_PREFETCH_INIT]: (state, action) => ({
    ...state,
    [getProp(action)]: {
      fetching: true,
      promise: action.payload.data,
    },
  }),

  [REDUX_PREFETCH_SUCCESS]: (state, action) => ({
    ...state,
    [getProp(action)]: {
      ...action.payload,
      fetching: false,
    },
  }),

  [REDUX_PREFETCH_ERROR]: (state, action) => ({
    ...state,
    [getProp(action)]: {
      ...action.payload,
      fetching: false,
    },
  }),
}, initialState);

export const prefetchInit = createAction(REDUX_PREFETCH_INIT, (namespace, action) => {
  return {
    namespace,
    data: action,
  };
});

export const prefetchSuccess = createAction(REDUX_PREFETCH_SUCCESS, (namespace, result) => {
  return {
    namespace,
    data: result,
    error: false,
  };
});

export const prefetchError = createAction(REDUX_PREFETCH_ERROR, (namespace, error) => {
  return {
    namespace,
    data: error,
    error: true,
  };
});

export const prefetchReset = createAction(REDUX_PREFETCH_RESET);
