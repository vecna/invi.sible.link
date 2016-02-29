import _ from 'lodash';
import Bacon from 'baconjs';

import Dispatcher from './dispatcher';
import filters from './filters';
import http from './http';

const d = Dispatcher();

// We listen to changes from the filters and update the current view.
const filtersP = filters.toProperty({
  searx: true,
  twitter_tweets: true,
  DuckDuckGo: true,
  starred: false,
  hidden: false,
  startDate: (new Date()).setDate((new Date()).getDate() - 300),
  endDate: (new Date()).setDate((new Date()).getDate()),
});


filtersP.onValue(state => {
  // All filters that are set to true are becoming our valid sources for the
  // current view.
  let sources = _(state).pick(_.identity).keys().value();
  d.push('update', {
                  "sources":sources,
                  "startDate":state.startDate,
                  "endDate":state.endDate,
                  "starred":state.starred,
                  "hidden":state.hidden
                });
});

export default {
  toItemsProperty: initial => {
    // The first element of the tuple is the original collections, the second
    // element is the current view on the collection.
    return Bacon.update(
      [initial, initial],
      [d.stream('update')], filterTimeline,
      [d.stream('star')], starItemInCollection,
      [d.stream('hide')], hideItemInCollection
    );

    //this item will update an item in the collections status to starred. called currently after the unit.js http.put from the frontend interaction.
    function starItemInCollection([original, current], idHash) {
      _.find(original, (v) => v._ls_id_hash == idHash )
        ._ls_starred = true;
      return [original, current];
    }

    //this item will update an item in the collections status to hidden. called currently after the unit.js http.put from the frontend interaction.
    function hideItemInCollection([original, current], idHash) {
      _.find(original, (v) => v._ls_id_hash == idHash )
        ._ls_visible = false;
      return [original, current];
    }

    function filterTimeline([original], stateFilters) {

      // if (stateFilters.startDate == null) {
      //   stateFilters.startDate = _.last(original)._ls_publishing_date;
      // }
      // if (stateFilters.endDate == null) {
      //   stateFilters.endDate = _.first(original)._ls_publishing_date;
      // }

      let current = _.filter(original, (v) => {
          // is the source enabled?
          return _.contains(stateFilters.sources, v._ls_source) &&
          // is the item visible, or are we showing the invisible
          ( !("_ls_visible" in v) || v._ls_visible == true || stateFilters.hidden == true) &&
          // is the item starred?  are we showing only starred?
          (v._ls_starred == true || stateFilters.starred == false) &&
          // check if it is between dates
          new Date(v._ls_publishing_date) >= new Date(stateFilters.startDate) &&
          new Date(v._ls_publishing_date) <= new Date(stateFilters.endDate)
        });


      return [original, current];
    }
  },
  star: (idHash) =>
    d.push('star', idHash),
  hide: (idHash) =>
    d.push('hide', idHash),

  // Public API
  // String -> Future [Unit]
  // Fetch a list of units for a profile.
  fetch: (profile) => {
    let url = `${document.location.origin}/api/profiles/${profile}/units`;
    return http.get(url);
  }
}

