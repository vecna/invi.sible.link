import React from 'react';

import NavBar from './NavBar';

export default class App extends React.Component {
  render () {
    return (
      <div>
        <NavBar />
        {this.props.children}
      </div>
    );
  }
}
