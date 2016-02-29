import _ from 'lodash';
import React from 'react';
import {Link} from 'react-router';

import history from '../lib/history';

import HistoryItem from '../components/HistoryItem';

export default class History extends React.Component {
  constructor (props) {
    super(props);
    this.state = props;
  }

  componentDidMount () {
    history.fetch().then((results) => this.setState({data: results}));
  }

  render () {
    let { data } = this.state;

    return (
      <div>
        <h1>Some Menu</h1>
        <Link to="/profiles">All Profiles</Link>
        <h1>History</h1>
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <td>Profile</td>
                <td>State</td>
                <td>Start</td>
                <td>Duration</td>
                <td>Plugins</td>
                <td>Info</td>
              </tr>
            </thead>
            <tbody>
              {_.map(data, (record) =>
                <HistoryItem key={record._id} record={record}/>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
