import React from 'react';
import { render } from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

// Views
import App from './eyes/components/App';
import History from './eyes/components/History';
import ProfileList from './eyes/components/ProfileList';
import ProfileCreate from './eyes/components/ProfileCreate';
import ProfileEdit from './eyes/components/ProfileEdit';
import ProfileDetails from './eyes/components/ProfileDetails';

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
