import React from 'react';

import filters from '../lib/filters';

export default class UnitFilter extends React.Component {
  constructor (props) {
    super(props);
    this.clickFilter = this.clickFilter.bind(this);
  }

  clickFilter (ev) {
    filters.update(this.props.unitType, ev.target.checked);
  }

  componentDidMount () {
    // We make sure that this unit filter is active right from the start.
    //filters.update(this.props.unitType, true);
  }

  render () {
    let {
      unitType,
      unitsCount,
      label
    } = this.props;

    return (
      <div className={"unitType-filter filter-"+unitType}>
        <input id={unitType + "-checkbox"} className={"unitType-checkbox checkbox-"+unitType}
        defaultChecked="checked" type="checkbox" title={"click to hide or show "+unitType+" results"} onClick={this.clickFilter}/>
        <label type="button" htmlFor={unitType + "-checkbox"} className={"btn btn-unitType btn-"+unitType}>
          <span className="glyphicon glyphicon-ok"></span>
          <span className="badge" id={unitType + "-count"}>{label} ({unitsCount})</span>
        </label>
      </div>
    );
  }
}
