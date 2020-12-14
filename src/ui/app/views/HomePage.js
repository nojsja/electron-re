import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ProcessManager from './processManager';

import { history } from 'app/App';

class HomePage extends Component {
  static propTypes = {
    pub: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  onDataChange = (data) => {
    console.log(`tree changed: `, data);
  }

  push = (path) => {
    history.push(path);
  }

  render() {
    const { match, routes } = this.props;

    return (
      <div className="container-router">
        <ProcessManager />
      </div>
    );
  }
}

HomePage.propTypes = {};

export default HomePage;
