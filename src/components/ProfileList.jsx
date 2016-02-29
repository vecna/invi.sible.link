import _ from 'lodash';
import React from 'react';
import {Link} from 'react-router';

import ProfileItem from './ProfileItem';

import profiles from '../lib/profiles';

export default class ProfileList extends React.Component {
  constructor (props) {
    super(props);
    this.state = {profiles: []};
  }

  componentDidMount () {
    const profilesP = profiles.toItemsProperty();

    this.unsubscribe = profilesP.onValue(data => this.setState({data: data}));
    profiles.fetch();
  }

  componentWillUnmount () {
    this.unsubscribe();
  }

  render () {
    let { data } = this.state;

    return (
      <div className="profilesListPage container-fluid">
          <Link to="/profiles/new" role="button" className="btn btn-success btn-sm pull-right profileAddButton">
            <span className="glyphicon glyphicon-plus"></span>
            <span className="profileAddButtonLabel">Add Profile</span>
          </Link>
          <h2 className="profilesListingPageTitle">Profiles</h2>
          <div className="table-responsive">
            <table id="profileList"
                   className="table table-hover table-striped table-bordered table-condensed">
              {_.map(data, (p) => <ProfileItem key={p.profileId}
                                               profile={p}
                                               history={this.props.history}/>)}
          </table>
        </div>
      </div>
    );
  }
}
