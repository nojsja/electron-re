import React from 'react';
import { Route, Router } from 'react-router-dom';
import { Provider } from 'mobx-react';

import { createHashHistory } from 'history';
import RouteWithSubRoutes from './router/RouteWithSubRoutes';
import routes from './router/index';

import PublicState from './stores/Public';
import Lang from './stores/Lang';
import Process from './stores/Process';

/* ------------------- global history ------------------- */
export const history = createHashHistory();

const stores = {
  pub: new PublicState(),
  lang: new Lang(),
  process: new Process(),
};

function App() {
  return (
    <Provider {...stores}>
      <Router history={history}>
        <Router history={history}>
          <RouteWithSubRoutes route={routes} />
        </Router>
      </Router>
    </Provider>
  );
}

/* ------------------- export provider ------------------- */
export default App;
