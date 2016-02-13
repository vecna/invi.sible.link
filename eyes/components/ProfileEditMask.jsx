import React from 'react';

export default class ProfileEditMask extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleInput = this.handleInput.bind(this);
    this.handleTerms = this.handleTerms.bind(this);
    this.profileName = this.profileName.bind(this);
    this.profileTwitter = this.profileTwitter.bind(this);
    this.profileSearx = this.profileSearx.bind(this);
    this.profileDuckDuckGo = this.profileDuckDuckGo.bind(this);
  }

  handleInput (ev) {
    let obj = {};
    obj["" + ev.target.id] = ev.target.value;
    this.setState(obj);
  }

  handleTerms (ev) {
    let obj = {};
    obj["" + ev.target.id] = {}
    obj["" + ev.target.id]["terms"] = ev.target.value.split('\n');
    this.setState(obj);
  }

  profileName() {
    return this.state.profileName || this.props.profileName || "";
  }

  profileTwitter() {
    return this.state.profileTwitter || this.props.profileTwitter || "";
  }

  profileSearx() {
    let searx = this.state.profileSearx || this.props.profileSearx || {};
    return (searx.terms == null) ? "" : searx.terms.join('\n');
  }

  profileDuckDuckGo() {
    let ddg = this.state.profileDuckDuckGo || this.props.profileDuckDuckGo || {};
    return (ddg.terms == null) ? "" : ddg.terms.join('\n');
  }

  render () {
    let profileName = this.profileName(),
        profileTwitter = this.profileTwitter(),
        profileSearx = this.profileSearx(),
        profileDuckDuckGo = this.profileDuckDuckGo();

    return (
      <div>
        <div className="form-group">
          <label htmlFor="profileName">Profile Name</label>
          <input type="text" className="form-control" id="profileName"
                 value={profileName} onChange={this.handleInput}
                 placeholder="e.g. George Bush" />
        </div>
        <div className="form-group">
          <label htmlFor="profileTwitter">Twitter Handle</label>
          <input type="text" className="form-control" id="profileTwitter"
                 onChange={this.handleInput}
                 value={profileTwitter}
                 placeholder="@georgie" />
        </div>
        <div className="form-group">
          <label htmlFor="profileSearx">Searx</label>
          <textarea id="profileSearx" className="form-control"
                    onChange={this.handleTerms}
                    value={profileSearx}
                    placeholder="Enter each term on a new line" />
        </div>
        <div className="form-group">
          <label htmlFor="profileDuckDuckGo">DuckDuckGo</label>
          <textarea id="profileDuckDuckGo" className="form-control"
                    onChange={this.handleTerms}
                    value={profileDuckDuckGo}
                    placeholder="Enter each term on a new line" />
        </div>
      </div>
    );
  }
}
