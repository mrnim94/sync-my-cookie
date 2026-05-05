import React, {Component} from 'react';
import ReactDom from 'react-dom';
const style = require('./options.module.scss');
import './global.scss';

import { Modal } from 'antd';
import Settings from './components/setting/setting';

class Options extends Component {
  public render() {
    return (
      <div className={style.wrapper}>
        <div className={style.setting}>
          <Settings onSet={this.handleSet} />
        </div>
      </div>
    );
  }
  private handleSet = () => {
    // Blur the currently focused element before opening the modal so antd v3
    // does not put aria-hidden on an ancestor of a focused descendant
    // (Chrome 124+ accessibility warning: 'Blocked aria-hidden on an element
    // because its descendant retained focus').
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    Modal.success({
      title: 'Saved',
      onOk() {
        window.close();
      },
    });
  }
}

ReactDom.render(
  <Options />,
  document.getElementById('root'),
);
