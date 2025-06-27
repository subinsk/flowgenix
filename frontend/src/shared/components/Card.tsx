import React from 'react';
import { motion } from 'framer-motion';
import { ANIMATIONS } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  shadow = 'md',
  rounded = 'md',
  border = true,
  onClick,
}) => {
  const getPaddingClasses = (padding: string) => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'md':
        return 'p-4';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const getShadowClasses = (shadow: string) => {
    switch (shadow) {
      case 'none':
        return '';
      case 'sm':
        return 'shadow-sm';
      case 'md':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg';
      default:
        return 'shadow-md';
    }
  };

  const getRoundedClasses = (rounded: string) => {
    switch (rounded) {
      case 'none':
        return '';
      case 'sm':
        return 'rounded-sm';
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      default:
        return 'rounded-md';
    }
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { y: -2, shadow: '0 10px 25px rgba(0,0,0,0.1)' } : {}}
      transition={ANIMATIONS.SPRING_SMOOTH}
      className={`
        bg-white dark:bg-gray-800
        ${border ? 'border border-gray-200 dark:border-gray-700' : ''}
        ${getPaddingClasses(padding)}
        ${getShadowClasses(shadow)}
        ${getRoundedClasses(rounded)}
        ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}
        ${hover ? 'transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

export default Card;
