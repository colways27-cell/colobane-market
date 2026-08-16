import React from 'react';

export const DressIcon = ({ size = 28, strokeWidth = 1.5, color = "currentColor", ...props }) => (
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
    <path d="M9 2 L15 2 L19 8 L16 10 L17 22 L7 22 L8 10 L5 8 Z" />
    <path d="M9 2 Q12 5 15 2" />
  </svg>
);
