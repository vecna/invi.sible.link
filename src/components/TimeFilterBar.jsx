import React from 'react';

import filters from '../lib/filters';

export default class TimeFilterBar extends React.Component {
  constructor (props) {
    super(props);
  }
  componentDidMount () {
    $("#startdate").datepicker("update", new Date(this.props.startDate));
    $("#enddate").datepicker("update", new Date(this.props.endDate));

  }


  render () {
    let {  } = this.props;

    //datepicker js moved to profiledetails.jsx


    return (
      <form className="form-inline">
        <h6 className="filter-group-title pull-left">Time Period</h6>
        <div className="btn-group btn-group-xs" >

          <div className="input-group input-daterange">
            <input id="startdate" type="text" className="form-control" data-date-format="dd-M-yyyy" placeholder="From">
            </input>
            <span className="input-group-addon">to</span>
            <input id="enddate" type="text" className="form-control" data-date-format="dd-M-yyyy" placeholder="To">
            </input>
          </div>

        </div>
      </form>
    );
  }
}
