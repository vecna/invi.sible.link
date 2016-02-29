import React from 'react';

import UnitFilter from './UnitFilter';

export default class FilterBar extends React.Component {
  render () {
    let {
      counts
    } = this.props;

    return (
      <form classNameName="form-inline">
        <h6 className="filter-group-title pull-left">Sources</h6>
        <div classNameName="btn-group btn-group-xs" >
          <UnitFilter label="Searx" unitType="searx" unitsCount={counts['searx'] || 0} />
          <UnitFilter label="DuckDuckGo" unitType="DuckDuckGo" unitsCount={counts['DuckDuckGo'] || 0} />
          <UnitFilter label="Twitter" unitType="twitter_tweets"
                      unitsCount={counts['twitter_tweets'] || 0} />
        </div>
      </form>
    );
  }
}
