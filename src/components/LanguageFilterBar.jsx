import React from 'react';

import LanguageFilter from './LanguageFilter';

export default class LanguageFilterBar extends React.Component {
  render () {
    let { counts } = this.props;
    return (
      <form classNameName="form-inline">
        <h6 className="filter-group-title">LANGUAGES</h6>
        <div classNameName="btn-group btn-group-xs" >
          <LanguageFilter unitLanguage="English"/>
          <LanguageFilter unitLanguage="Khmer"/>
          <LanguageFilter unitLanguage="Bahasa"/>
        </div>
      </form>
    );
  }
}
