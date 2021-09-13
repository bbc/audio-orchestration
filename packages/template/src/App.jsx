import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

// Import names used for identifying the current page
import {
  PAGE_START,
  PAGE_LOADING,
  PAGE_ERROR,
  PAGE_PLAYING,
  PAGE_CONNECT_FORM,
  PAGE_CONNECT_DIRECT,
  PAGE_INSTRUCTIONS,
  PAGE_LOADING_TUTORIAL,
  PAGE_CALIBRATION,
  ROLE_MAIN,
} from 'sagas';

// Import configuration object derived from index.html settings
import config from 'config';

// Import the page components: only one of these is used at a time.
import StartPage from 'pages/start-page/StartPage';
import LoadingPage from 'pages/loading-page/LoadingPage';
import LoadingTutorialPage from 'pages/loading-tutorial-page/LoadingTutorialPage';
import InstructionsPage from 'pages/instructions-page/InstructionsPage';
import ErrorPage from 'pages/error-page/ErrorPage';
import PlayingPage from 'pages/playing-page/PlayingPage';
import ConnectFormPage from 'pages/connect-form-page/ConnectFormPage';
import ConnectDirectPage from 'pages/connect-direct-page/ConnectDirectPage';
import CalibrationPage from 'pages/calibration-page/CalibrationPage';

// Import the TasterBadge shown on the main device, if enabled in the settings
import TasterBadge from 'components/taster-badge/TasterBadge';

// set this to true, set PILOT_ID, and add script tag to index.html to use this
const enableTasterBadge = false;

/**
 * The App is the top level presentational component.
 *
 * It selects the currently active page to render, and forwards all its props to the page. Each
 * page may contain further logic to show different screens depending on its props.
 *
 * The loading, error, and help (and any other screens you may want to add) are boolean properties
 * in the state. They change as these pages should become visible, or hidden.
 *
 * Finally, there is a footer that is common to all pages. This is included directly here.
 */
const App = ({
  page,
}) => {
  const role = useSelector((state) => state.role);

  let CurrentPage;

  switch (page) {
    case PAGE_START:
      CurrentPage = StartPage;
      break;
    case PAGE_LOADING:
      CurrentPage = LoadingPage;
      break;
    case PAGE_LOADING_TUTORIAL:
      CurrentPage = LoadingTutorialPage;
      break;
    case PAGE_INSTRUCTIONS:
      CurrentPage = InstructionsPage;
      break;
    case PAGE_ERROR:
      CurrentPage = ErrorPage;
      break;
    case PAGE_PLAYING:
      CurrentPage = PlayingPage;
      break;
    case PAGE_CONNECT_FORM:
      CurrentPage = ConnectFormPage;
      break;
    case PAGE_CONNECT_DIRECT:
      CurrentPage = ConnectDirectPage;
      break;
    case PAGE_CALIBRATION:
      CurrentPage = CalibrationPage;
      break;
    default:
      CurrentPage = ErrorPage;
  }

  let tasterBadge = null;
  if (enableTasterBadge && role === ROLE_MAIN && config.PILOT_ID) {
    tasterBadge = (
      <TasterBadge
        visible={page === PAGE_PLAYING}
        pilotId={config.PILOT_ID}
      />
    );
  }

  return (
    <div className="app">
      <CurrentPage />
      {tasterBadge}
    </div>
  );
};

App.defaultProps = {
  page: PAGE_LOADING,
};

App.propTypes = {
  page: PropTypes.string,
};

export default App;
