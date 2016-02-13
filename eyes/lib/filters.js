import _ from 'lodash';
import Bacon from 'baconjs';
import Dispatcher from './dispatcher';

const d = Dispatcher();

export default {
  toProperty: initial => {
    return Bacon.update(
      initial,
      [d.stream('toggleFilter')], toggle
    );

    function toggle(filters, {filter, state}) {
      return _.merge(filters, {[filter]: state});
    }
  },

  // Public API
  // String -> Boolean -> Nil
  // Set the state of a filter.
  update: (filter, state) =>
    d.push('toggleFilter', {filter: filter, state: state})
}
