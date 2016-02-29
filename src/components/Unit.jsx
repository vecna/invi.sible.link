import _ from 'lodash';
import React from 'react';

import {formatDate} from '../lib/utils';

import unit from '../lib/unit';


export default class Unit extends React.Component {

  constructor (props) {
    super(props);
    this.openUnit = this.openUnit.bind(this);
    this.starUnit = this.starUnit.bind(this);
    this.hideUnit = this.hideUnit.bind(this);
  }


  hideUnit () {
    //send an api put request to hide the selected item
    unit.hide(this.props._ls_profile, this.props._ls_id_hash);
  }

  starUnit () {
    //send an api put reequest to update the database with starred
    unit.star(this.props._ls_profile, this.props._ls_id_hash);
  }

  openUnit (e){
    e.preventDefault();

    unit.fetch(this.props._ls_profile, this.props._ls_id_hash);

    $('#timeline').animate({
        scrollTop: document.getElementById(this.props._ls_id_hash).offsetTop - 50
     }, 500);

    $('html, body').animate({
        scrollTop: document.getElementById("unit-details").offsetTop - 50
     }, 300);

    $(".active-item").removeClass("active-item");

    $("#" + this.props._ls_id_hash).addClass("active-item");
  }

  render () {
    let {
      _ls_id_hash,
      _ls_links,
      _ls_images,
      _ls_profile,
      _ls_source,
      screen_name,
      profile_image,
      tweet,
      content,
      user,
      _ls_starred,
      _ls_visible,
      _ls_publishing_date,
    } = this.props,
    links = _.reject(_ls_links, {type: 'self'});
    var images =_.map(_ls_images);
    var relLinks =_.map(_ls_links);

    return (
      <li id={_ls_id_hash} className={`ls-listitem ls-listitem-${_ls_source}`}>
        {this.props._ls_starred}
                {this.props._ls_visible}
        <div onClick={this.openUnit} className="unitopener">
          <div className="unit-date container-fluid">
            <span className="ls-listitem-publishDate">{formatDate(_ls_publishing_date)}</span>
            <span className="ls-listitem-screenName"><strong>{((screen_name) ? "  @"+ screen_name : "")}</strong></span>
            <div className="ls-actions pull-right">
              <span className="ls-actions-label">Mark as</span>
              <div onClick={this.starUnit} title="Starred" alt="Starred"
                className={"glyphicon glyphicon-star " + ((_ls_starred) ? "starred-true" : "")} >
              </div>
              <div onClick={this.hideUnit} title="Hidden" alt="Hidden"
                className={"glyphicon glyphicon-fire " +
                ( !(_ls_visible || _ls_visible === undefined) ? "hidden-true" : "")}>
              </div>
            </div>
          </div>
          <div>
            <div className="container-fluid">
              <div className="ls-listitem-body ls-listitem-body-data">
                {((tweet) ? tweet : "")}
                {((content) ? content : "")}
              </div>
            </div>
            <div className="ls-listitem-contains">
              <span 
              className={"ls-listitem-relations glyphicon " + 
              ((images.length > 0) ? "glyphicon-picture" : "glyphicon-hidden")}>
              </span>
              <span 
              className={"ls-listitem-relations glyphicon " + 
              ((relLinks.length > 0) ? "glyphicon-link" : "glyphicon-hidden")}>
              </span>              
            </div>
          </div>
        </div>
      </li>
    );
  }
}
