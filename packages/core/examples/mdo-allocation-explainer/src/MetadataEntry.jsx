import React from 'react';

class MetadataEntry extends React.Component {
  constructor(props) {
    super(props);
    this.objectsRef = React.createRef();
    this.devicesRef = React.createRef();
    this.state = {
      isOpen: false,
      objectsError: false,
      devicesError: false,
    };
    this.handleReallocate = this.handleReallocate.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleReallocate() {
    const { onReallocate } = this.props;

    let objects = null;
    let devices = null;

    try {
      objects = JSON.parse(this.objectsRef.current.value);
      this.setState({ objectsError: false });
    } catch (e) {
      console.warn(e);
      this.setState({ objectsError: true });
    }

    try {
      devices = JSON.parse(this.devicesRef.current.value);
      this.setState({ devicesError: false });
    } catch (e) {
      console.warn(e);
      this.setState({ devicesError: true });
    }

    if (objects && devices) {
      onReallocate({
        objects,
        devices,
      });
    }
  }

  handleOpen() {
    this.setState({ isOpen: true });
  }

  handleClose() {
    this.setState({ isOpen: false });
  }

  render() {
    const {
      onClearState,
      objects,
      devices,
    } = this.props;

    const {
      objectsError,
      devicesError,
      isOpen,
    } = this.state;

    return (
      <div className="metadata-entry">
        <div className={`flex-row ${isOpen ? '' : 'hidden'}`}>
          <div className="flex-column metadata-field">
            <h1>Objects</h1>
            <textarea ref={this.objectsRef} defaultValue={JSON.stringify(objects, null, 2)} className={objectsError ? 'error' : ''} />
          </div>
          <div className="flex-column metadata-field">
            <h1>Devices</h1>
            <textarea ref={this.devicesRef} defaultValue={JSON.stringify(devices, null, 2)} className={devicesError ? 'error' : ''} />
          </div>
        </div>
        <p>
          <button type="button" onClick={this.handleReallocate}>Re-run allocation</button>
          <button type="button" onClick={onClearState}>Clear state</button>
          { isOpen
            ? <button type="button" onClick={this.handleClose}>Close metadata editor</button>
            : <button type="button" onClick={this.handleOpen}>Edit metadata</button> }
        </p>
      </div>
    );
  }
}

export default MetadataEntry;
