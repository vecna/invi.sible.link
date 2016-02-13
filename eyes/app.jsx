import React from 'react';
import { render } from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

// Views
import App from './components/App';
import History from './components/History';
import ProfileList from './components/ProfileList';
import ProfileCreate from './components/ProfileCreate';
import ProfileEdit from './components/ProfileEdit';
import ProfileDetails from './components/ProfileDetails';

render((
  <Router history={createBrowserHistory()}>
    <Route path="/" component={App}>
      <IndexRoute component={History}/>
      <Route path="profiles" component={ProfileList} />
      <Route path="profiles/new" component={ProfileCreate} />
      <Route path="profiles/:profileId" component={ProfileDetails} />
      <Route path="profiles/:profileId/edit" component={ProfileEdit} />
    </Route>
  </Router>
), document.getElementById('app'));
