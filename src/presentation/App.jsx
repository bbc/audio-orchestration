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
