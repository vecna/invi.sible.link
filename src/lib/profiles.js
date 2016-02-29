import _ from 'lodash';
import Bacon from 'baconjs';

import Dispatcher from './dispatcher';
import http from './http';

const d = Dispatcher();

export default {
  toItemsProperty: (initial=[]) => {
    return Bacon.update(
      initial,
      [d.stream('fetched')], update,
      [d.stream('remove')], remove
    );

    function update(old, profiles) {
      return profiles;
    }

    function remove(profiles, profileId) {
      return _.reject(profiles, (p) => p.profileId === profileId);
    }
  },

  // Public API
  // Fetch all profiles
  fetch: () => {
    let url = `${document.location.origin}/api/profiles`;
    return http.get(url)
               .then((results) => d.push('fetched', results));
  },

  show: (profileId) => {
    let url =`${document.location.origin}/api/profiles/${profileId}`;
    return http.get(url);
  },

  update: (profile) => {
    let profileId = profile.profileId,
        url =`${document.location.origin}/api/profiles/${profileId}`;
    return http.put(url, _.omit(profile, profileId));
  },

  create: (profile) => {
    let url = `${document.location.origin}/api/profiles`;
    return http.post(url, profile)
  },

  remove: (profileId) => {
    let url = `${document.location.origin}/api/profiles/${profileId}`;
    return http.del(url)
               .then(() => d.push('remove', profileId));
  }
}
