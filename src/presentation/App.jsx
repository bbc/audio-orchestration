import React from 'react';
import PropTypes from 'prop-types';

// Import the style sheet
import './main.scss';

// Import the pages: only one of these is used at a time.
import Start from './Pages/Start';
import Master from './Pages/Master';
import Slave from './Pages/Slave';
import Loading from './Pages/Loading';
import ErrorPage from './Pages/Error';
import Help from './Pages/Help';

/**
 * The App is the top level presentational component.
 *
 * It selects the currently active page to render, and forwards all its props to the page. Each
 * page may contain further logic to show different screens depending on its props.
 */
const App = (props) => {
  const {
    role,
    loading,
    error,
    help,
  } = props;

  // The role decides which base page would be shown, unless a special condition is set.
  let CurrentPage = Start;
  if (role === 'master') {
    CurrentPage = Master;
  } else if (role === 'slave') {
    CurrentPage = Slave;
  }

  // The base page can be replaced by a higher priority message, such as help, loading, or error.
  // The order here is important, e.g. an error may occur during loading and should be visible.
  if (help) {
    CurrentPage = Help;
  }

  if (loading) {
    CurrentPage = Loading;
  }

  if (error) {
    CurrentPage = ErrorPage;
  }

  return <CurrentPage {...props} />;
};

App.propTypes = {
  role: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  help: PropTypes.bool.isRequired,
};

App.defaultProps = {
  role: 'none',
};

export default App;
