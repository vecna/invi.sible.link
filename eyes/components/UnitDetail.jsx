import _ from 'lodash';
import React from 'react';

import Unit from './Unit';

import unit from '../lib/unit';


export default class UnitDetail extends React.Component {

  constructor(props) {
    super(props);
    this.state = {unit: {}};
  }

  componentDidMount () {
    const unitStreamP = unit.toProperty(null);
    this.unsubscribe = unitStreamP.onValue( data =>{
      this.setState({
        unit: data
      })
    });
  }

  componentWillUnmount () {
    this.unsubscribe();
  }

  render () {

    let {
      unit,
    } = this.state;

    return (
      <div>
        <div className="detail-detail detail-date">{unit._ls_publishing_date}</div>

        <h3 className="detail-detail detail-source">{unit._ls_source} {unit.engine}</h3>

        <div className="detail-detail detail-hash">{unit._ls_id_hash}</div>

        <div className="detail-detail detail-content">
          <h3>Content</h3>
          {unit.tweet ||
            unit.content ||
            "Click on Tracking Unit to the left to see more"}
        </div>


        <div className="detail-detail detail-searx-link">
          {unit.url}
        </div>


        <div className="detail-detail detail-images">
          <h3>Images</h3>
          { _.map(unit._ls_images, elem => {
            return <img key={elem.href} src={elem.href} />
          })}
        </div>


        <div className="detail-detail detail-links">
          <h3>Links</h3>
          { _.map(unit._ls_links, elem => {
            return <li><a key={elem.href} href={elem.href} >{elem.href}</a></li>
          })}
        </div>

        <div className="detail-detail detail-twitter-hashtags">
          <h3>Hashtags</h3>
          { _.map(unit.hashtags, elem => {
            return <li key={elem}>{elem}</li>
          })}
        </div>

        <div className="detail-detail detail-twitter-mentions">
          <h3>Mentions</h3>
          { _.map(unit.mentions, elem => {
            return <li key={elem}>{elem}</li>
          })}
        </div>

      </div>
    );
  }
}
