import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

export function render(path = '/') {
  return renderToString(React.createElement(App, { pagePath: path }));
}
