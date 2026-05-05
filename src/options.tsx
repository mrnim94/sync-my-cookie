import React, {Component} from 'react';
import { createRoot } from 'react-dom/client';
const style = require('./options.module.scss');
import './global.scss';

import { Modal } from 'antd';
import Settings from './components/setting/setting';
import { installAriaSentinelFix } from './utils/aria-sentinel-fix';

// Strip aria-hidden from rc-dialog focus-trap sentinels so Chrome 124+
// does not log 'Blocked aria-hidden on an element because its
// descendant retained focus' when the user tabs through a Modal.
installAriaSentinelFix();

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

const optionsRoot = document.getElementById('root');
if (optionsRoot) {
  createRoot(optionsRoot).render(<Options />);
}
