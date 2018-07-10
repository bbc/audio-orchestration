import React from 'react';
import { hot } from 'react-hot-loader';
import Allocations from './Allocations';
import MetadataTable from './MetadataTable';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleObjects: props.objects.map(o => o.objectId),
    };
  }

  componentWillReceiveProps() {
    this.setState((prevState, props) => Object.assign({}, prevState, {
      visibleObjects: props.objects.map(o => o.objectId),
    }));
  }

  setObjectVisible(objectId, visible) {
    this.setState((prevState, props) => Object.assign({}, prevState, {
      visibleObjects: props.objects.filter((object) => {
        if (object.objectId === objectId) {
          return visible;
        }
        return prevState.visibleObjects.includes(object.objectId);
      }).map(o => o.objectId),
    }));
  }

  render() {
    const { visibleObjects } = this.state;
    const { objects, numDevices } = this.props;
    return (
      <div>
        <Allocations
          objects={objects}
          numDevices={numDevices}
          visibleObjects={visibleObjects}
          setObjectVisible={(objectId, visible) => { this.setObjectVisible(objectId, visible); }}
        />
        <br />
        <MetadataTable
          objects={objects}
          visibleObjects={visibleObjects}
          setObjectVisible={(objectId, visible) => { this.setObjectVisible(objectId, visible); }}
        />
      </div>
    );
  }
}

export default hot(module)(App);
