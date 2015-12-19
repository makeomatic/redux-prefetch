import { handleActions, createAction } from 'redux-action';
import { REDUX_PREFETCH_INIT, REDUX_PREFETCH_SUCCESS, REDUX_PREFETCH_ERROR } from './constants.js';

const initialState = {

};

export default handleActions({
  [REDUX_PREFETCH_INIT]: (state, action) => ({
    ...state,
    [`${action.payload.namespace}_fetching`]: true,
  }),

  [REDUX_PREFETCH_SUCCESS]: (state, action) => ({
    ...state,
    [`${action.payload.namespace}_fetching`]: {
      ...action.payload,
    },
  }),

  [REDUX_PREFETCH_ERROR]: (state, action) => ({
    ...state,
    [`${action.payload.namespace}_fetching`]: {
      ...action.payload,
    },
  }),
}, initialState);

export const prefetchInit = createAction(REDUX_PREFETCH_INIT, (namespace, action) => {
  return {
    namespace,
    promise: action,
  };
});

export const prefetchSuccess = createAction(REDUX_PREFETCH_SUCCESS, (namespace, action) => {
  return {
    namespace,
    data: action.payload,
  };
});

export const prefetchError = createAction(REDUX_PREFETCH_ERROR, (namespace, action) => {
  return {
    namespace,
    error: action.payload,
  };
});
