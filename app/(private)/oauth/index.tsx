import React from 'react';

import { Redirect } from 'expo-router';

import { Routes } from '@constants/routes';
import { useAppStore } from '@store/index';

const OAuthSpotify = () => {
  const { user } = useAppStore();

  if (user) {
    return <Redirect href={Routes.SEARCH} />;
  }

  return <Redirect href={Routes.LOGIN} />;
};

export default OAuthSpotify;
