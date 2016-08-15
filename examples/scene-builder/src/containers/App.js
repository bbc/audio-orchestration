import React from 'react';
import SourcesContainer from './SourcesContainer';
import SceneContainer from './SceneContainer';
import { styles, joinStyles } from '../styles';

const App = () => (
  <div style={joinStyles(styles.app, styles.flexbox)} >
    <SceneContainer style={styles.flexboxItem} />
    <SourcesContainer style={styles.flexboxItem} />
  </div>
);

export default App;
