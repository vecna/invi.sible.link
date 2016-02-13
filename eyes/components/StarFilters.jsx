import _ from 'lodash';
import React from 'react';

import filters from '../lib/filters';


export default class StarFilters extends React.Component {

  constructor(props) {
    super(props);
    this.filterStarred = this.filterStarred.bind(this);
    this.filterHidden = this.filterHidden.bind(this);
  }

  componentDidMount () {

  }

  filterStarred (ev) {
    filters.update("starred", ev.target.checked);
  }

  filterHidden (ev) {
    filters.update("hidden", ev.target.checked);
  }

  render () {
    return (
      <form classNameName="form-inline">
        <h6 className="filter-group-title pull-left">Marked as</h6>
        <div classNameName="btn-group btn-group-sm" >
          <div className="star-filter filter-starred">
            <input id="starbutton" type="checkbox" className="starFilter-checkbox checkbox-starred"
              onClick={this.filterStarred}>
            </input>
            <label htmlFor="starbutton" className="btn btn-starFilter btn-starred">
              <span className="glyphicon glyphicon-star"></span>
              <span className="badge-starFiler">Starred</span>
            </label>
          </div>
          <div className="star-filter filter-hidden">
            <input id="hiddenbutton" type="checkbox" className="starFilter-checkbox checkbox-hidden"
              onClick={this.filterHidden}>
            </input>
            <label htmlFor="hiddenbutton" className="btn btn-starFilter btn-hudden">
              <span className="glyphicon glyphicon-fire"></span>
              <span className="badge-starFiler">Hidden</span>
            </label>
          </div>
        </div>
      </form>

    );
  }
}
