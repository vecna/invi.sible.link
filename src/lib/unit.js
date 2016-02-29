import _ from 'lodash';
import Bacon from 'baconjs';

import Dispatcher from './dispatcher';
import http from './http';

import units from './units.js';

const d = Dispatcher();



export default {
  toProperty: initial => {
    // The first element of the tuple is the original collections, the second
    // element is the current view on the collection.
    return Bacon.update(
      [initial, initial],
      [d.stream('fetched')], update
    );

    function update(oldUnit, newUnit) {
      return newUnit;
    }


  },

  // Public API
  // String -> Future [Unit]
  // Fetch a list of units for a profile.

  fetch: (profile, id_hash) => {
    let url = `${document.location.origin}/api/profiles/${profile}/units/${id_hash}`;
    return http.get(url)
                  .then(unitResult => d.push('fetched', unitResult));
  },

  star: (profile, id_hash) => {
    let url = `${document.location.origin}/api/profiles/${profile}/units/${id_hash}`;
    let unit = {"_ls_starred":true};
    return http.put(url, unit).then(d => units.star(id_hash));

  },

  hide: (profile, id_hash) => {
    let url = `${document.location.origin}/api/profiles/${profile}/units/${id_hash}`;
    let unit = {"_ls_visible":false};
    return http.put(url, unit).then(d => units.hide(id_hash));
  }
}


