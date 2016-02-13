import _ from 'lodash';
import React from 'react';

export default class DuckDuckGo extends React.Component {
  render () {
    let {
      _ls_links,
      _ls_source,
      title,
      content,
    } = this.props,
    links = _.reject(_ls_links, {type: 'self'});

    return (
      <li className={_ls_source}>
        <div className="ls-listitem ls-listitem-duckduckgo container-fluid">
          <div className="row">
            <div className="ls-listitem-sidebar ls-listitem-sidebar-data">
              <div className="glyphicon glyphicon-duckduckgo btn-lg"></div>
            </div>
            <div className="ls-listitem-body ls-listitem-body-data">
              <p>{_ls_source}: {title}</p>
              <small>{content}</small>
            </div>
          </div>
          <div className="row">
            <div className="ls-listitem-sidebar ls-listitem-sidebar-meta">
              <div className="glyphicon glyphicon-tags btn-lg"></div>
            </div>
            <div className="ls-listitem-body ls-listitem-body-meta">
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
