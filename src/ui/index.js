import { AppContainer } from 'react-hot-loader';
import React from 'react';
import { render } from 'react-dom';

import './app/styles/public.less';

import App from './app/App';

render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./app/App', () => {
      render(require('./app/App').default)
  })
}