import React, { Component } from 'react';
const style = require('./console.module.scss');

import { Button, Modal, Select, Spin, Switch, Tooltip } from 'antd';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { auto, AutoConfiguration, gist } from '../../utils/store';
const { Textfit } = require('react-textfit');

import _ from 'lodash';

interface Prop {
  domain: string;
  canMerge: boolean;
  onMerge: () => void;
  onPush: () => void;
}

interface State {
  autoMerge: boolean;
  autoPush: boolean;
  autoPushName: string[];
  pushLoading: boolean;
  configuring: boolean;
  options: JSX.Element[];
}

class Console extends Component<Prop, State> {
  public constructor(props: Prop) {
    super(props);
    this.state = {
      autoMerge: false,
      autoPush: false,
      autoPushName: [],
      pushLoading: false,
      configuring: false,
      options: [],
    };
  }
  public render() {
    if (this.props.domain) {
      return (
        <div className={style.wrapper}>
          <Textfit
            className={style.domain}
            max={40}
          >
            {this.props.domain}
          </Textfit>
          <div className={style.sliders}>
            <div className={style.one}>
              <div className={style.secret}>
                <CloudUploadOutlined className={[style.upload, style.icon].join(' ')} />
                <Tooltip placement='topLeft' title='Configure Auto Push'>
                  <Button
                    shape='circle'
                    icon={<SettingOutlined />}
                    className={style.setting}
                    onClick={this.handleAutoPushConfigClick}
                    disabled={!this.props.canMerge}
                  />
                </Tooltip>
                <Modal
                  title='Configure Auto Push Rules'
                  open={this.state.configuring}
                  onOk={this.handleAutoPushConfigDone}
                  onCancel={this.handleAutoPushConfigClose}
                >
                  <div>Only push when these cookies are changed:</div>
                  <Select<string[]>
                    mode='tags'
                    className={style.select}
                    placeholder='Name of cookie, empty for all'
                    onChange={this.handleAutoPushConfigChange}
                    value={this.state.autoPushName}
                    style={{ width: '100%' }}
                  >
                    {this.state.options}
                  </Select>
                </Modal>
              </div>
              <span className={style.description}>Auto Push</span>
              <Switch
                checked={this.state.autoPush}
                onChange={this.handleAutoPushChange}
                disabled={!this.props.canMerge}
              />
            </div>
            <div className={style.one}>
              <CloudDownloadOutlined className={style.icon} />
              <span className={style.description}>Auto Merge</span>
              <Switch
                checked={this.state.autoMerge}
                onChange={this.handleAutoMergeChange}
                disabled={!this.props.canMerge}
              />
            </div>
          </div>
          <div className={style.buttons}>
            <Button
              type='primary'
              onClick={this.handlePush}
              loading={this.state.pushLoading}
              size='large'
            >
              Push
            </Button>
            <Button
              type='default'
              onClick={this.props.onMerge}
              disabled={!this.props.canMerge}
              size='large'
            >
              Merge
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className={style.empty}>
          <Spin size='large' />
        </div>
      );
    }
  }

  public async componentDidUpdate(prevProps: Prop) {
    // React 18: replaces deprecated componentWillReceiveProps. We only
    // want to refetch the auto-config when the domain prop actually
    // changes; otherwise we would loop on every setState().
    if (prevProps.domain !== this.props.domain) {
      const config = await auto.get(this.props.domain);
      this.setState({...config});
    }
  }

  public async componentDidMount() {
    // Initial load — componentDidUpdate only fires on subsequent prop
    // changes, not on first mount. Keep the same auto-config behavior
    // as the legacy componentWillReceiveProps did when first invoked.
    if (this.props.domain) {
      const config = await auto.get(this.props.domain);
      this.setState({...config});
    }
  }

  private handleAutoPushConfigClick = async () => {
    const cookies = await gist.getCookies(this.props.domain);
    const options = _.uniq(cookies.map((cookie) => cookie.name as string)).map((name) => {
      return <Select.Option key={name}>{name}</Select.Option>;
    });
    // Blur the trigger before opening the modal so antd v3 does not put
    // aria-hidden on an ancestor of a focused element (Chrome 124+ a11y
    // warning: 'Blocked aria-hidden on an element because its descendant
    // retained focus').
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.setState({
      configuring: true,
      options,
    });
  }
  private handleAutoPushConfigDone = async () => {
    const config: AutoConfiguration = {
      autoPush: this.state.autoPush,
      autoMerge: this.state.autoMerge,
      autoPushName: this.state.autoPushName,
    };
    await auto.set(this.props.domain, config);
    this.handleAutoPushConfigClose();
  }
  private handleAutoPushConfigClose = () => {
    this.setState({configuring: false});
  }
  private handleAutoPushConfigChange =
    async (value: string[], options: React.ReactElement<any> | Array<React.ReactElement<any>>) => {
    if (options instanceof Array) {
      const autoPushName = options
        .filter((option) => typeof option.key === 'string')
        .map((option) => option.key) as string[];
      this.setState({autoPushName});
    }
  }
  private handlePush = async () => {
    this.setState({pushLoading: true});
    await this.props.onPush();
    this.setState({pushLoading: false});
  }
  private handleAutoPushChange = async (checked: boolean) => {
    this.setState({
      autoPush: checked,
    });
    const config: AutoConfiguration = {
      autoPush: checked,
      autoMerge: this.state.autoMerge,
      autoPushName: this.state.autoPushName,
    };
    await auto.set(this.props.domain, config);
  }
  private handleAutoMergeChange = async (checked: boolean) => {
    this.setState({
      autoMerge: checked,
    });
    const config: AutoConfiguration = {
      autoPush: this.state.autoPush,
      autoMerge: checked,
      autoPushName: this.state.autoPushName,
    };
    await auto.set(this.props.domain, config);
  }
}

export default Console;
