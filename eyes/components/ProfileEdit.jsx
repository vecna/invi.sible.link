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

export default class ProfileEdit extends React.Component {
  constructor (props) {
    super(props);
    this.state = _.merge({
      name: null, profileId: null, twitter: null, ddg: null, searx: null
    }, props);
    this.updateProfile = this.updateProfile.bind(this);
  }

  componentDidMount() {
    profiles.show(this.props.params.profileId)
            .then((result) => this.setState(result));
  }

  updateProfile (e) {
    e.preventDefault();
    console.log(e);

    //FIXME: The manual parsing of this form is error prone, better use
    //       something like react-forms or similar.
    let t = e.target,
        profile = {
          profileId: this.props.params.profileId,
          name: t[0].value,
          twitter: t[1].value === '' ? undefined : t[1].value,
          searx: t[2].value === '' ? undefined : {terms: t[2].value.split('\n')},
          ddg: t[3].value === '' ? undefined : {terms: t[3].value.split('\n')}
        };

    profiles.update(compactObj(profile))
            .then(() => this.props.history.push('/profiles'));
  }

  render () {
    let {
      name,
      twitter,
      ddg,
      searx
    } = this.state,
    profileId = this.props.params.profileId;

    return (
      <div className="container">
      <h3>Edit Profile</h3>
      <form action='' onSubmit={this.updateProfile} className="profileEditForm">
        <ProfileEditMask profileName={name} profileTwitter={twitter}
                         profileSearx={searx} profileDuckDuckGo={ddg}
                         profileId={profileId} />
        <div className="form-group">
          <input className="btn btn-success" type="submit" value="Update" />
          <input className="btn btn-danger" type="button" value="Cancel"
                 onClick={() => this.props.history.push('/profiles')}/>
        </div>
      </form>
      </div>
    );
  }
}
