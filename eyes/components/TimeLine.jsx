import _ from 'lodash';
import React from 'react';

import Unit from './Unit';
import UnitDetail from './UnitDetail';


export default class TimeLine extends React.Component {

  constructor(props) {
    super(props);
  }

  render () {
    let {
      original,
      current,
    } = this.props;

    return (
      <div className="container-fluid ls-atomic-items">
        <div className="row row-eq-height">
          <div className="panel panel-default col-md-6 ls-listview">
            <div id="timeline" className="panel-body">
              <div>
                <h3>{_.size(current)} of {_.size(original)} units displayed.</h3>
                <ul className="timeLine-list">
                  {_.map(current, elem => {
                     let child;

                     child = <Unit key={elem._ls_id_hash} {...elem} />;
                     return child;
                   })}
                </ul>
              </div>
            </div>
          </div>
          <div id="unit-details" className="col col-md-6 ls-visualisation">
            <UnitDetail />
          </div>
        </div>
      </div>
    );
  }
}
