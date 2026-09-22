import React from 'react';

export const NavigationContainer = ({ children }) => React.createElement('div', null, children);
export const DarkTheme = { colors: {} };
export const createBottomTabNavigator = () => ({
  Navigator: ({ children }) => React.createElement('div', null, children),
  Screen: ({ component: Comp, options }) => (Comp ? React.createElement(Comp, null) : null),
});
export const createNativeStackNavigator = () => ({
  Navigator: ({ children }) => React.createElement('div', null, children),
  Screen: ({ component: Comp, options }) => (Comp ? React.createElement(Comp, null) : null),
});

export default {
  NavigationContainer,
  DarkTheme,
  createBottomTabNavigator,
  createNativeStackNavigator,
};
