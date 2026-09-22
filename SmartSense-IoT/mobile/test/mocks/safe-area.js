import React from 'react';

export const SafeAreaView = ({ children, style, ...props }) =>
  React.createElement('div', { style, ...props }, children);

export const SafeAreaProvider = ({ children }) =>
  React.createElement('div', null, children);

export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });

export default {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
};
