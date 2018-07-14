import React from 'react';
import PropTypes from 'prop-types';

// Import the style sheet
import './main.scss';

// Import the pages: only one of these is used at a time.
import Start from './Pages/Start';
import Master from './Pages/Master';
import Slave from './Pages/Slave';

// Import the Modals: these may be overlays, they appear on top of the Page but may cover all of it.
import Loading from './Modals/LoadingModal';
import Error from './Modals/ErrorModal';
import Help from './Modals/HelpModal';

/**
 * The App is the top level presentational component.
 *
 * It selects the currently active page to render, and forwards all its props to the page and the
 * modal overlays. The overlays include logic to decide whether to show them or not.
 */
const App = (props) => {
  const { role } = props;

  let page = <Start {...props} />;

  if (role === 'master') {
    page = <Master {...props} />;
  } else if (role === 'slave') {
    page = <Slave {...props} />;
  }

  return (
    <div>
      { page }
      <Loading {...props} />
      <Error {...props} />
      <Help {...props} />
    </div>
  );
};

App.propTypes = {
  role: PropTypes.string,
};

App.defaultProps = {
  role: 'none',
};

export default App;
