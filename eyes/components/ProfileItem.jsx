import _ from 'lodash';
import React from 'react';
import {Link} from 'react-router';

import profiles from '../lib/profiles';

export default class ProfileItem extends React.Component {
  constructor() {
    super();
    this.editProfile = this.editProfile.bind(this);
  }

  editProfile() {
    this.props.history.push(`/profiles/${this.props.profile.profileId}/edit`);
  }

  render () {
    let {
      profileId,
      name,
      twitter,
      searx,
      ddg
    } = this.props.profile,
    searxListing = '',
    ddgListing = '';

    if (_.isObject(searx)) {
      searxListing = (
        <ul id="profileListing-Searx">
          {_.map(searx.terms, (elem, idx) =>
            <li className="profileListing-searchTerms" key={idx}>{elem}</li>)
          }
        </ul>)
    }

    if (_.isObject(ddg)) {
      ddgListing = (
        <ul id="profileListing-DuckDuckGo">
          {_.map(ddg.terms, (elem, idx) =>
            <li className="profileListing-searchTerms" key={idx}>{elem}</li>)
          }
        </ul>)
    }

    return (
      <tbody>
        <tr>
          <td colSpan="3" className="profileListing profilelisting-profileId">
            <h3 className="profileListingProfileName col-lg-12 col-md-12 col-sm-12">
              <Link to={`/profiles/${profileId}`}>{name}</Link>
              <ul className="profileListing-actionList pull-right list-inline">
                <li className="profileListing-actionListItem">
                  <a role="button" title="Edit" className="btn btn-xs"
                     onClick={this.editProfile}>
                    <span className="glyphicon glyphicon-pencil"> </span>
                  </a>
                </li>
                {/* <li className="profileListing-actionListItem">
                <a role="button" title="Disable" className="btn btn-xs">
                <span className="glyphicon glyphicon-eye-close"> </span>
                </a>
                </li> */}
                <li className="profileListing-actionListItem">
                  <a role="button" title="Delete" className="btn btn-xs"
                     onClick={() => profiles.remove(profileId)}>
                     <span className="glyphicon glyphicon-trash"> </span>
                  </a>
                </li>
                {/* <li className="profileListing-actionListItem">
                <a role="button" title="History" className="btn btn-xs">
                <span className="glyphicon glyphicon-dashboard"> </span>
                </a>
                </li> */}
              </ul>
            </h3>
          </td>
        </tr>
        <tr>
          <td className="profileListing col-lg-1 col-md-1 col-sm-1">
            <label htmlFor="profileListing-twitter">Twitter</label>
            <div id="profileListing-twitter">{twitter}</div>
          </td>
          <td className="profileListing col-lg-7 col-md-7 col-sm-7">
            <label htmlFor="profileListing-Searx">Searx terms</label>
            {searxListing}
          </td>
          <td className="profileListing col-lg-7 col-md-7 col-sm-7">
            <label htmlFor="profileListing-twitter">DuckDuckGo terms</label>
            {ddgListing}
          </td>
        </tr>
        <tr><td colSpan="3" className="profileListSeparator"></td></tr>
      </tbody>
    );
  }
}
