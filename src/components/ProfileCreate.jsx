import _ from 'lodash';
import React from 'react';

import profiles from '../lib/profiles';
import ProfileEditMask from "./ProfileEditMask";

const compactObj = obj =>
  _.reduce(obj, (memo, v, k) => {
    if (v == null) {
      return memo;
    } else {
      memo[k] = v;
      return memo;
    }
  }, {})

export default class ProfileCreate extends React.Component {
  constructor (props) {
    super(props);
    this.saveProfile = this.saveProfile.bind(this);
  }

  saveProfile (e) {
    e.preventDefault();
    // FIXME: Flash error when validation fails.
    if (e.target[0] === '') return

    //FIXME: The manual parsing of this form is error prone, better use
    //       something like react-forms or similar.
    let t = e.target,
        profile = {
          profileId: t[0].value.split(' ').join('_'),
          name: t[0].value,
          twitter: t[1].value === '' ? undefined : t[1].value,
          searx: t[2].value === '' ? undefined : {terms: t[2].value.split('\n')},
          ddg: t[3].value === '' ? undefined : {terms: t[3].value.split('\n')}
        };

    profiles.create(compactObj(profile))
            .then(() => this.props.history.push('/profiles'));
  }

  render () {
    return (
      <div className="container">
      <h3>Create/Edit Profile</h3>
      <form action='' onSubmit={this.saveProfile} className="profileEditForm">
        <ProfileEditMask />
        <div className="form-group">
          <input className="btn btn-success" type="submit" value="Create" />
          <input className="btn btn-danger" type="button" value="Cancel"
                 onClick={() => this.props.history.push('/profiles')}/>
        </div>
      </form>
      </div>
    );
  }
}
