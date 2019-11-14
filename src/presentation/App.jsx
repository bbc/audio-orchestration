import React from 'react';
import PropTypes from 'prop-types';

// Import the style sheet
import './main.scss';

import {
  PAGE_START,
  PAGE_LOADING,
  PAGE_ERROR,
  PAGE_MAIN_PLAYING,
  PAGE_CONNECT_FORM,
  PAGE_CONNECT_DIRECT,
  PAGE_CONTROLS,
  PAGE_AUXILIARY_PLAYING,
  PAGE_AUXILIARY_DISCONNECTED,
} from '../sagas';

// Import the pages: only one of these is used at a time.
import StartPage from './Pages/Start';
import LoadingPage from './Pages/Loading';
import ErrorPage from './Pages/Error';
import MainPlayingPage from './Pages/MainPlaying';
import ConnectFormPage from './Pages/ConnectForm';
import ConnectDirectPage from './Pages/ConnectDirect';
import ControlsPage from './Pages/Controls';
import AuxiliaryPlayingPage from './Pages/AuxiliaryPlaying';
import AuxiliaryDisconnectedPage from './Pages/AuxiliaryDisconnected';
import Footer from './Footer';
import config from '../config';

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
const App = (props) => {
  const {
    page,
  } = props;

  let CurrentPage;

  switch (page) {
    case PAGE_START:
      CurrentPage = StartPage;
      break;
    case PAGE_LOADING:
      CurrentPage = LoadingPage;
      break;
    case PAGE_ERROR:
      CurrentPage = ErrorPage;
      break;
    case PAGE_MAIN_PLAYING:
      CurrentPage = MainPlayingPage;
      break;
    case PAGE_CONNECT_FORM:
      CurrentPage = ConnectFormPage;
      break;
    case PAGE_CONNECT_DIRECT:
      CurrentPage = ConnectDirectPage;
      break;
    case PAGE_AUXILIARY_PLAYING:
      CurrentPage = AuxiliaryPlayingPage;
      break;
    case PAGE_AUXILIARY_DISCONNECTED:
      CurrentPage = AuxiliaryDisconnectedPage;
      break;
    case PAGE_CONTROLS:
      CurrentPage = ControlsPage;
      break;
    default:
      CurrentPage = ErrorPage;
  }

  // Way too many divs to make the layout work. Every page is displayed in a single grid item
  // to avoid extraneous repeated mark up in every page component.
  return (
    <div id="page-wrapper" style={{ '--accent-colour': config.ACCENT_COLOUR }}>
      <div id="content-background">
        <div className="wrap">
          <div className="row">
            <CurrentPage {...props} />
          </div>
        </div>
      </div>
      <div id="footer-background">
        <div className="wrap">
          <div className="row">
            <Footer />
          </div>
        </div>
      </div>
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
