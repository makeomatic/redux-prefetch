# Redux prefetch

[![Greenkeeper badge](https://badges.greenkeeper.io/makeomatic/redux-prefetch.svg)](https://greenkeeper.io/)

Allows universal server-side rendering to be performed without much hassle.
Exposes `@fetch` decorator and `storeEnchancer`, which keeps track of unresolved promises.
Add `.resolve` function to store

## Install

`npm i redux-prefetch -S`

## Usage

The most important files are listed here, but look in the example for some extra stuff.

```js
// createStore.js
import { createStore, applyMiddleware, compose } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import reducers from '../modules/reducers';
import { syncReduxAndRouter } from 'redux-simple-router';
import { canUseDOM as isBrowser } from 'fbjs/lib/ExecutionEnvironment';
import { reduxPrefetch } from 'redux-prefetch';

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
```

```js
// server.js
import React from 'react';
import merge from 'lodash/object/merge';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { match, RoutingContext } from 'react-router';
import routes from './routes';
import createStore from './store/create';
import metaState from './constants/config.js';
import HTML from './components/HTML';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';
import DocumentMeta from 'react-document-meta';

export default function middleware(config = {}) {
  const meta = merge({}, metaState, config);

  // this is middleware for Restify, but can easily be changed for express or similar
  return function serveRoute(req, res, next) {
    match({ routes, location: req.url }, (err, redirectLocation, renderProps) => {
      if (err) {
        return next(err);
      }

      if (redirectLocation) {
        res.setHeader('Location', redirectLocation.pathname + redirectLocation.search);
        res.send(302);
        return next(false);
      }

      if (!renderProps) {
        return next('route');
      }

      // this is because we don't want to initialize another history store
      // but apparently react-router passes (err, state) instead of (state), which
      // is expected by redux-simple-router
      const { history } = renderProps;
      const { listen: _listen } = history;
      history.listen = callback => {
        return _listen.call(history, (_, nextState) => {
          return callback(nextState.location);
        });
      };
      const store = createStore(history, { meta });

      // wait for the async state to resolve
      store.resolve(renderProps.components, renderProps.params).then(() => {
        const page = renderToString(
          <Provider store={store}>
            <RoutingContext {...renderProps} />
          </Provider>
        );
        const state = store.getState();
        const exposed = 'window.__APP_STATE__=' + serialize(state) + ';';
        const html = renderToStaticMarkup(<HTML meta={DocumentMeta.renderAsHTML()} markup={page} version="0.14.3" state={exposed} />);

        res.setHeader('content-type', 'text/html');
        res.send(200, '<!DOCTYPE html>' + html);
        return next(false);
      });
    });
  };
}
```

```js
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import DocumentMeta from 'react-document-meta';
import { dummy } from './modules/user' ;
import { fetch } from 'redux-prefetch';

function prefetch({ dispatch, getState }, params) {
  const timeout = parseInt(params.id || 30, 10);
  if (getState().user.result !== timeout) {
    return dispatch(dummy(timeout));
  }
}

// this is the important part
// it wraps the component with 2 handlers: componentDidMount() and static fetch()
// static function is performed on the server for state resolution before rendering
// the data
// componentDidMount() is obviously only performed on the client. Because this state
// will be already resolved on load, you need to make sure that necessary checks are performed
// and async actions are not repeated again
@fetch("root", prefetch)
@connect(state => ({ meta: state.meta, user: state.user }))
export default class App extends Component {
  static propTypes = {
    children: PropTypes.element,
    meta: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
  };

  render() {
    return (
      <div>
        <DocumentMeta {...this.props.meta.app} />
        <h1>Hello world: {this.props.user.result}</h1>
        <div>{this.props.children && React.cloneElement(this.props.children, {
          userId: this.props.user.result,
        })}</div>
      </div>
    );
  }
}
```
