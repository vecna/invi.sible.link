import React from 'react';

import filters from '../lib/filters';

export default class LanguageFilter extends React.Component {
  constructor (props) {
    super(props);
    this.clickFilter = this.clickFilter.bind(this);
  }

  clickFilter (ev) {
    filters.update(this.props.unitLanguage, ev.target.checked);
  }

  componentDidMount () {
    // We make sure that this unit filter is active right from the start.
    filters.update(this.props.unitLanguage, true);
  }

  render () {
    let { unitLanguage } = this.props;

    return (
      <div className={"unitLanguage-filter filter-"+unitLanguage}>
        <input id={unitLanguage + "-checkbox"} className={"unitLanguage-checkbox checkbox-"+unitLanguage} 
        defaultChecked="checked" type="checkbox" onClick={this.clickFilter}/>
        <label  title={"click to hide or show "+unitLanguage+" results"} type="button" htmlFor={unitLanguage + "-checkbox"} className={"btn btn-unitLanguage btn-"+unitLanguage}>
          {unitLanguage}
        </label>
      </div>
    );
  }
}