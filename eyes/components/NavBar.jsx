import React from 'react';
import {IndexLink} from 'react-router';

export default class NavBar extends React.Component {
  render () {
    return (
      <nav id="ls-navbar" className="navbar navbar-default">
          <div className="navbar-header">
            <IndexLink className="navbar-brand" to="/">
              <span className="glyphicon glyphicon-home"></span>
            </IndexLink>
            <ul className="nav navbar-nav navbar-right navbar-user">
              <li role="presentation" className="dropdown">
                <a className="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
                  <span className="glyphicon glyphicon-user"></span>
                </a>
                <ul className="dropdown-menu">
                  <li><a href="#">Account details</a></li>
                  <li><a href="#">Change Password</a></li>
                  <li role="separator" className="divider"></li>
                  <li><a href="#">Logout</a></li>
                </ul>
              </li>
            </ul>
        </div>
      </nav>
    );
  }
}
