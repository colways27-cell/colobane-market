import React from 'react';

export const ShoeIcon = ({ size = 28, strokeWidth = 1.5, color = "currentColor", ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M4 16v-2c0-1.1.9-2 2-2h1l2-4h4l2 4h1c1.1 0 2 .9 2 2v2H4z" />
    <path d="M4 16h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z" />
  </svg>
);
