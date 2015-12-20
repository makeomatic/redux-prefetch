/**
 * Dispatched when async action started resolving
 * @type {String}
 */
export const REDUX_PREFETCH_INIT = '@@redux-prefetch/init';

/**
 * Dispatched when async action resolved successfully
 * @type {String}
 */
export const REDUX_PREFETCH_SUCCESS = '@@redux-prefetch/success';

/**
 * Dispatched when async action failed to resolve
 * @type {String}
 */
export const REDUX_PREFETCH_ERROR = '@@redux-prefetch/error';

/**
 * Cleans up prefetch state
 * @type {String}
 */
export const REDUX_PREFETCH_RESET = '@@redux-prefetch/reset';
