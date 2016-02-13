import _ from 'lodash';
import React from 'react';

import {formatDate} from '../lib/utils';

export default class Searx extends React.Component {
  render () {
    let {
      _ls_links,
      _ls_source,
      title,
      _ls_publishing_date
    } = this.props,
    links = _.reject(_ls_links, {type: 'self'});

    return (
      <li className={_ls_source}>
        <div className="ls-listitem ls-listitem-searx container-fluid">
          <div className="row">
            <div className="ls-listitem-sidebar ls-listitem-sidebar-data">
              <div className="glyphicon glyphicon-searx btn-lg"></div>
            </div>
            <div className="ls-listitem-body ls-listitem-body-data">
              <p>{_ls_source}: {title}</p>
            </div>
          </div>
          <div className="row">
            <div className="ls-listitem-sidebar ls-listitem-sidebar-meta">
              <div className="glyphicon glyphicon-tags btn-lg"></div>
            </div>
            <div className="ls-listitem-body ls-listitem-body-meta">
              <p>On {formatDate(_ls_publishing_date)}</p>
              <ul>
                {_.map(links, link => (
                   <li key={link._ls_id_hash}>
                     <a href={link.href}>{link.href}</a>
                   </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </li>
    );
  }
}
