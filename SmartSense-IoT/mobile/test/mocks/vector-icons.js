import React from 'react';

export const Feather = ({ name, size, color, style }) =>
  React.createElement('span', { 'data-icon': name, style }, `[${name}]`);

export const Ionicons = ({ name, size, color, style }) =>
  React.createElement('span', { 'data-icon': name, style }, `[${name}]`);

export const MaterialCommunityIcons = ({ name, size, color, style }) =>
  React.createElement('span', { 'data-icon': name, style }, `[${name}]`);

export default {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
};
