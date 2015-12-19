import { combineReducers } from 'redux';
import { routeReducer } from 'redux-simple-router';
import userReducer from './user';

export default combineReducers({
  user: userReducer,
  routing: routeReducer,
  meta: (meta) => ({ ...meta }),
});
