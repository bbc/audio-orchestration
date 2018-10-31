import React from 'react';
import { styles, joinStyles } from '../styles';
import { channelHandlers } from '../audio';

const SourceList = (props) => (
  <div style={joinStyles(styles.flexboxColumn, props.style)}>
    <h1 style={joinStyles(styles.title, styles.flexboxItemFirst)}>
      {props.title}
    </h1>

    <div
      style={joinStyles(styles.flexbox, styles.flexboxColumnItem)}
    >
      <button
        style={joinStyles(styles.button, styles.flexboxFirstItem)}
        onClick={props.onAddSource}
      >
        +
      </button>
      <select
        style={joinStyles(styles.select, styles.flexboxItem)}
        value={props.channelHandler}
        onChange={props.onChannelHandlerChanged}
      >
        {channelHandlers.map(handler =>
          <option key= {handler.key} value={handler.key}>
            {handler.title} ({handler.desc})
          </option>)}
      </select>
      <button
        style={joinStyles(styles.button, styles.flexboxItem)}
        onClick={props.onSave}
      >
        Save
      </button>
      <button
        style={joinStyles(styles.button, styles.flexboxItem)}
        onClick={props.onLoad}
      >
        Load
      </button>
    </div>

    <div style={joinStyles(styles.flexboxColumn, styles.flexboxColumnItem)}>
      {props.children}
    </div>
  </div>
);

SourceList.defaultProps = {
  title: 'Sources',
};

SourceList.propTypes = {
  style: React.PropTypes.object,
  children: React.PropTypes.node,
  className: React.PropTypes.string,
  title: React.PropTypes.string.isRequired,
  channelHandler: React.PropTypes.string.isRequired,
  onAddSource: React.PropTypes.func.isRequired,
  onSave: React.PropTypes.func.isRequired,
  onLoad: React.PropTypes.func.isRequired,
  onChannelHandlerChanged: React.PropTypes.func.isRequired,
};

export default SourceList;
