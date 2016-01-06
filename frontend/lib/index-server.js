'use strict';

import React from 'react';
import Matter from 'kyper-matter';
import Root from '../app/root';
import { createMemoryHistory } from 'history';
import { reduxReactRouter } from 'redux-router/server';
import configureStore from '../app/store/configureStore';

export default (cb) => {
  // Compile an initial state
  let matter = new Matter('tessellate');
  let initialState = {account: {}};
  if(matter.currentUser){
    initialState.account = matter.currentUser;
  }
  // Create a new Redux store instance
  const store = configureStore(initialState, reduxReactRouter, createMemoryHistory);

  // Grab the initial state from our Redux store
  const finalState = store.getState();

  return cb({
    appData: finalState,
    appMarkup: React.renderToString(<Root store={ store } />)
  });
}
