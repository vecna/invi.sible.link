import _ from 'lodash';
import React from 'react';
import Bacon from 'baconjs';

import units from '../lib/units';

import TimePicker from './TimePicker';
import FilterBar from './FilterBar';
import LanguageFilterBar from './LanguageFilterBar';
import TimeFilterBar from './TimeFilterBar';
import StarFilters from './StarFilters';

import TimeLine from './TimeLine';

import filters from '../lib/filters';


export default class ProfileDetails extends React.Component {
  constructor (props) {
    super(props);
    this.distractionFree = this.distractionFree.bind(this);
    this.state = _.merge({
        original: [],
        current: [],
        startDate:(new Date()).setDate((new Date()).getDate() - 300) ,
        endDate:(new Date()).setDate((new Date()).getDate()) ,
      },
      props);
  }

  // react mounts the component  - called only one time
  componentDidMount () {
    const profile = this.state.routeParams.profileId;


    // get the data to populate the component, store the stream in a variable.
    const unitsStreamP = Bacon
      // fetch calls the server according to the Units bacon api
      .fromPromise(units.fetch(profile))
      // take the latest result from the server and turn it into a streamproperty
      // using the function toItemsProperty, which a bacon streamproperty
      .flatMapLatest(results => {
        filters.update();
        return units.toItemsProperty(results);
      });

    // when the stream changes, update react.  onValue is a bacon function.
    this.unsubscribe = unitsStreamP.onValue(data => {
      this.setState({
        original: data[0],
        current: data[1],
        // startDate: new Date(_.last(data[0])._ls_publishing_date),
        // endDate: new Date(_.first(data[0])._ls_publishing_date),
      })
      }
    );


    const filtersP = filters.toProperty({
      startDate: (new Date()).setDate((new Date()).getDate() - 300),
      endDate: (new Date()).setDate((new Date()).getDate()),
    });

    filtersP.onValue(state => {
      this.setState({
        startDate: state.startDate,
        endDate: state.endDate,
      });
    });


      $('#startdate')
      .datepicker({
        "autoclose": true,
        "format":"dd-M-yyyy",
      })
      .on("changeDate", function(e) {
        filters.update("startDate", e.date);
      });

      $('#enddate')
      .datepicker({
        "autoclose": true,
        "format":"dd-M-yyyy",
      })
      .on("changeDate", function(e) {
        filters.update("endDate", e.date);
      });

  }

  componentWillUnmount () {
    this.unsubscribe();
  }

  distractionFree() {
    $('#ls-navbar').toggleClass('collapsed',300);
    $('#timepicker-viz').toggleClass('collapsed',600);
    $('#timeline').toggleClass('open',600);
    $('#unit-details').toggleClass('open',600);
  } 

  render () {
    let {
      original,
      current
    } = this.state,
    counts = _.countBy(original, '_ls_source');

    // This html has been hevaily modified, restore from git f68de2a
    return (
      <div>
       <div id="timepicker-viz" className="">
          <div className="">
            <div id="stuff">
              <TimePicker bigData={current} startDate={this.state.startDate} endDate={this.state.endDate} />
            </div>
          </div>
        </div>
        <div className="container-fluid " id="application-filters">
          <div className="container-fluid">
            <div id="filter-bar" className="row">
              <div id="unittype-filters" className="filterbar-filters col-md-5">
                <FilterBar counts={counts} />
              </div>
              <div id="star-filters" className="filterbar-filters col-md-3">
                <StarFilters />
              </div>
              {/* <div id="unitlanguage-filters" className="filterbar-filters col-md-4">
                <LanguageFilterBar />
              </div> */}
              <div id="unittime-filters" className="filterbar-filters col-md-4 pull-right">
                <i id="distraction-free" className="fa fa-sort" onClick={this.distractionFree}></i> 
                <TimeFilterBar startDate={this.state.startDate} endDate={this.state.endDate} />
              </div>
            </div>
          </div>
        </div>
        <TimeLine original={original} current={current} />
      </div>
    );
  }
}
