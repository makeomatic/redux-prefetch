import React, { Component, PropTypes } from 'react';

class HtmlComponent extends Component {
  static propTypes = {
    markup: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    client: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
    meta: PropTypes.string.isRequired,
  };

  render() {
    return (
      <html>
        <head dangerouslySetInnerHTML={{ __html: this.props.meta }} />
        <body>
          <div id="app" dangerouslySetInnerHTML={{ __html: this.props.markup }} />
          <script dangerouslySetInnerHTML={{ __html: this.props.state }} />
          <script src={'//cdnjs.cloudflare.com/ajax/libs/react/' + this.props.version + '/react-with-addons.min.js'} defer />
          <script src={'//cdnjs.cloudflare.com/ajax/libs/react/' + this.props.version + '/react-dom.min.js'} defer />
          <script src="/public/js/browser.js" defer />
        </body>
      </html>
    );
  }
}

module.exports = HtmlComponent;
