import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import DocumentMeta from 'react-document-meta';
import { dummy } from './modules/user' ;
import { fetch } from './redux-prefetch';

function prefetch({ dispatch, getState }, params) {
  return dispatch(dummy(parseInt(params.id || 30, 10)));
}

@fetch('root', prefetch)
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
