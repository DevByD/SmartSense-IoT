import React from 'react';

export const Svg = ({ children, width, height, ...props }) =>
  React.createElement('svg', { width, height, ...props }, children);

export const Path = (props) => React.createElement('path', props);
export const Line = (props) => React.createElement('line', props);
export const Circle = (props) => React.createElement('circle', props);
export const Rect = (props) => React.createElement('rect', props);
export const Text = ({ children, ...props }) => React.createElement('text', props, children);

export default Svg;
