import React from 'react';

export const View = ({ children, style, testID, ...props }) =>
  React.createElement('div', { style, 'data-testid': testID, ...props }, children);

export const Text = ({ children, style, testID, numberOfLines, ...props }) =>
  React.createElement('span', { style, 'data-testid': testID, ...props }, children);

export const ScrollView = ({ children, style, refreshControl, contentContainerStyle, ...props }) =>
  React.createElement('div', { style, ...props }, children);

export const TouchableOpacity = ({ children, onPress, disabled, style, activeOpacity, ...props }) =>
  React.createElement('button', { onClick: disabled ? undefined : onPress, disabled, style, ...props }, children);

export const FlatList = ({ data, renderItem, keyExtractor, ListEmptyComponent, contentContainerStyle }) => {
  if (!data || data.length === 0) {
    return ListEmptyComponent ? (React.isValidElement(ListEmptyComponent) ? ListEmptyComponent : React.createElement(ListEmptyComponent, null)) : null;
  }
  return React.createElement(
    'div',
    { style: contentContainerStyle },
    data.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : index;
      return React.createElement(React.Fragment, { key }, renderItem({ item, index }));
    })
  );
};

export const ActivityIndicator = ({ size, color, ...props }) =>
  React.createElement('span', { ...props, 'data-testid': 'activity-indicator' }, 'Loading...');

export const RefreshControl = () => null;

export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
};

export const Alert = {
  alert: (title, message) => {},
};

export const StyleSheet = {
  create: (styles) => styles,
};

export const Platform = {
  OS: 'android',
  select: (obj) => obj.android || obj.default,
};

export default {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  StyleSheet,
  Platform,
};
