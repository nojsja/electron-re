import React from 'react';
import { Route, Router } from 'react-router-dom';
import { Provider } from 'mobx-react';

import { createHashHistory } from 'history';
import RouteWithSubRoutes from './router/RouteWithSubRoutes';
import routes from './router/index';

/* ------------------- global history ------------------- */
export const history = createHashHistory();

function App() {
  return (
    <Router history={history}>
      <RouteWithSubRoutes route={routes} />
    </Router>
  );
}

/* ------------------- export provider ------------------- */
export default App;
