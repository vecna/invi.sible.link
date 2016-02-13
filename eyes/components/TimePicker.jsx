import React from 'react';
import _ from 'lodash';
import Rickshaw from 'rickshaw';

export default class TimePicker extends React.Component {

  componentDidMount () {
  }

  render () {

    //process the data
    Date.prototype.addDays = function(days) {
      var dat = new Date(this.valueOf())
      dat.setDate(dat.getDate() + days);
      return dat;
    }


    // get an array of each date within the range
    let allDates = getDateRange( new Date(this.props.startDate), new Date(this.props.endDate));


    function getDateRange(startDate, stopDate) {
        var dateArray = new Array();
        var currentDate = startDate;
        while (currentDate <= stopDate) {
            dateArray.push( {"_ls_publishing_date":(new Date (currentDate)).setHours(0, 0, 0, 0, 0), "count":0, "_ls_source":"ss"} )
            currentDate = currentDate.addDays(1);
        }
        return dateArray;
    }

    // get the data of units
    var d3Data = _(this.props.bigData)
    // copy only the needed information
    .map(function(item){
      return {
        // the publishing date, set the time to 0 so we can group them
        "_ls_publishing_date":(new Date(item._ls_publishing_date)).setHours(0, 0, 0, 0, 0),
        "_ls_source":item._ls_source
      }
    })
    // group them by date
    .groupBy('_ls_publishing_date')
    // reduce the count of them and grouped by date and source
    .reduce(function(memo, unitsByDate, publishingDate) {
      var counts = _.countBy(unitsByDate, '_ls_source'),
          elems = _.map(counts, function (count, source) {
            return {
              _ls_publishing_date: publishingDate,
              _ls_source: source,
              count: count};
          });
      return memo.concat(elems);
    }, []);



    // construct the object for d3 -- will look like this
    /*
    {
      source:[{object},{object}],
      source:[{object},{object}]
    }
    */

    _.each(d3Data, function(v){
        v._ls_publishing_date = + v._ls_publishing_date;
    })
    let tweets = allDates.slice().concat(_.filter(d3Data, (x) =>  x._ls_source == "twitter_tweets"));
    let searx  = allDates.slice().concat(_.filter(d3Data, (x) =>  x._ls_source == "searx"));

    tweets = _.sortBy(tweets, function(i){
      return i._ls_publishing_date;
    });

    searx = _.sortBy(searx, function(i){
      return i._ls_publishing_date;
    });


    let grouped = {};

    if (tweets.length>1){
      grouped["tweets"] = tweets;
    }

    if (searx.length>1){
      grouped["searx"] = searx;
    }


    // start the d3 visualisation

    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = document.body.clientWidth - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    var formatDate = d3.time.format("%d-%b-%y");

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height-3, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("top");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");



    d3.select("#viz svg").remove();

    var svg = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      x.domain([this.props.startDate, this.props.endDate]);
      y.domain([0,d3.max(d3Data, function(d) { return d.count; })]);

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(-30," + height  + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0)
          .attr("dy", ".71em")
          .style("text-anchor", "end")

      var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(d._ls_publishing_date); })
        .y(function(d) { return y(d.count); });

      if(d3Data.length > 0){
      _.each(grouped, function(dgroup, groupname){
        svg.append("path")
            .datum(dgroup)
            .attr('stroke-width', 10)
            .attr('fill', 'none')
            .attr("class", "line "+groupname)
            .attr("d", line);
        });
      }


    function type(d) {
      d.date = formatDate.parse(d.date);
      d.close = +d.close;
      return d;
    }


















    return (
      <div id="viz">
      </div>
    );
  }
}
