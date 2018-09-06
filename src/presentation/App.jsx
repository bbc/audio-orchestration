import React from 'react';
import PropTypes from 'prop-types';

// Import the style sheet
import './main.scss';

import {
  PAGE_START,
  PAGE_LOADING,
  PAGE_ERROR,
  PAGE_MASTER_SETUP,
  PAGE_MASTER_PLAYING,
  PAGE_CONNECT_FORM,
  PAGE_CONNECT_DIRECT,
  PAGE_SLAVE_SETUP_LOCATION,
  PAGE_SLAVE_PLAYING,
  PAGE_SLAVE_PLAYING_LOCATION,
  PAGE_SLAVE_DISCONNECTED,
} from '../sagas';

// Import the pages: only one of these is used at a time.
import StartPage from './Pages/Start';
import LoadingPage from './Pages/Loading';
import ErrorPage from './Pages/Error';
import MasterSetupPage from './Pages/MasterSetup';
import MasterPlayingPage from './Pages/MasterPlaying';
import ConnectFormPage from './Pages/ConnectForm';
import ConnectDirectPage from './Pages/ConnectDirect';
import SlaveSetupLocationPage from './Pages/SlaveSetupLocation';
import SlavePlayingPage from './Pages/SlavePlaying';
import SlavePlayingLocationPage from './Pages/SlavePlayingLocation';
import SlaveDisconnectedPage from './Pages/SlaveDisconnected';
import Footer from './Footer';

/**
 * The App is the top level presentational component.
 *
 * It selects the currently active page to render, and forwards all its props to the page. Each
 * page may contain further logic to show different screens depending on its props.
 *
 * The 'role' can be start, master, or slave. It typically does not change after the user's initial
 * selection to create, or join a session.
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
    case PAGE_MASTER_SETUP:
      CurrentPage = MasterSetupPage;
      break;
    case PAGE_MASTER_PLAYING:
      CurrentPage = MasterPlayingPage;
      break;
    case PAGE_CONNECT_FORM:
      CurrentPage = ConnectFormPage;
      break;
    case PAGE_CONNECT_DIRECT:
      CurrentPage = ConnectDirectPage;
      break;
    case PAGE_SLAVE_SETUP_LOCATION:
      CurrentPage = SlaveSetupLocationPage;
      break;
    case PAGE_SLAVE_PLAYING:
      CurrentPage = SlavePlayingPage;
      break;
    case PAGE_SLAVE_PLAYING_LOCATION:
      CurrentPage = SlavePlayingLocationPage;
      break;
    case PAGE_SLAVE_DISCONNECTED:
      CurrentPage = SlaveDisconnectedPage;
      break;
    default:
      CurrentPage = ErrorPage;
  }

  // Way too many divs to make the layout work. Every page is displayed in a single grid item
  // to avoid etraneous repeated mark up in every page component.
  return (
    <div id="page-wrapper">
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
