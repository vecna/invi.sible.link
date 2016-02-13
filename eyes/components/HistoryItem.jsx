import _ from 'lodash';
import React from 'react';
import moment from 'moment'
import {Link} from 'react-router';

import {formatDate} from '../lib/utils';

export default class HistoryItem extends React.Component {
  render () {
    let {
      profileId,
      profileName,
      state,
      start,
      end,
      plugins,
      reason,
      stats
    } = this.props.record,
    stateClass,
    info = '',
    duration = moment.duration(moment(end)-moment(start)).humanize();

    switch(state) {
      case 'started':
        stateClass = 'info';
        duration = 'in progress';
        break;
      case 'failed':
        stateClass = 'danger';
        info = reason;
        break;
      case 'success':
        stateClass = 'success';
        info = _.reduce(stats, (memo, v, k) =>
          `${memo ? memo + ', ' : ''}${v} ${_.startCase(k)}`
        , null);
        break;
    }

    return (
      <tr className={stateClass}>
        <td><Link to={`/profiles/${profileId}`}>{profileName}</Link></td>
        <td>{state}</td>
        <td className="text-nowrap">
          {formatDate(start)}
        </td>
        <td className="text-nowrap">{duration}</td>
        <td>{plugins.join(" ↦ ")}</td>
        <td>{info}</td>
      </tr>
    );
  }
}
