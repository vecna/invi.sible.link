import _ from 'lodash';
import React from 'react';

import {formatDate} from '../lib/utils';

export default class Tweet extends React.Component {

  render () {
    let {
      _ls_links,
      _ls_source,
      screen_name,
      tweet,
      user,
      _ls_publishing_date,
    } = this.props,
    links = _.reject(_ls_links, {type: 'self'});

    return (
      <li className={_ls_source}>
        <div className="ls-listitem ls-listitem-tweet container-fluid">
          <div className="row">
            <div className="ls-listitem-sidebar ls-listitem-sidebar-data">
              <div className="glyphicon glyphicon-tweet btn-lg"></div>
            </div>
            <div className="ls-listitem-body ls-listitem-body-data">
              <p>{tweet}</p>
            </div>
          </div>
          <div className="row">
            <div className="ls-listitem-sidebar ls-listitem-sidebar-meta">
              <div className="glyphicon glyphicon-tags btn-lg"></div>
            </div>
            <div className="ls-listitem-body ls-listitem-body-meta">
              <p>By {screen_name}/{user} on {formatDate(_ls_publishing_date)}</p>
              <ol>{
                _.map(links, link => (
                  <li className="tweet-link" key={link._ls_id_hash}>
                    <a href={link.href}>{link.href}</a>
                    {link._ls_fetch ? <a href={link._ls_fetch.savedir}>↬</a> : ''}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </li>
    );
  }
}
