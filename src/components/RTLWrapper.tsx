'use client';

import React from 'react';
import { useTranslation } from '@/i18n/TranslationProvider';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
  flipIcons?: boolean;
  preserveNumbers?: boolean;
}

/**
 * RTLWrapper component
 * A utility component that helps with RTL-specific styling and behavior
 * 
 * @param children - The content to be wrapped
 * @param className - Additional CSS classes
 * @param flipIcons - Whether to flip icons in RTL mode
 * @param preserveNumbers - Whether to preserve numbers in LTR format even in RTL mode
 */
export default function RTLWrapper({
  children,
  className = '',
  flipIcons = false,
  preserveNumbers = false,
}: RTLWrapperProps) {
  const { isRTL } = useTranslation();
  
  // Determine the classes to apply
  const rtlClasses = [className];
  
  if (isRTL && flipIcons) {
    rtlClasses.push('icon-flip');
  }
  
  if (isRTL && preserveNumbers) {
    rtlClasses.push('numeric');
  }
  
  return (
    <div className={rtlClasses.join(' ')}>
      {children}
    </div>
  );
}

/**
 * RTLText component
 * A simpler version of RTLWrapper specifically for text content
 */
export function RTLText({
  children,
  className = '',
  preserveNumbers = false,
}: Omit<RTLWrapperProps, 'flipIcons'>) {
  const { isRTL } = useTranslation();
  
  // For simple text that doesn't need a div wrapper
  if (!isRTL || !preserveNumbers) {
    return <span className={className}>{children}</span>;
  }
  
  return (
    <span className={`${className} ${preserveNumbers ? 'numeric' : ''}`}>
      {children}
    </span>
  );
}

/**
 * RTLIcon component
 * A specialized component for icons that need to be flipped in RTL mode
 */
export function RTLIcon({
  children,
  className = '',
  flip = true,
}: {
  children: React.ReactNode;
  className?: string;
  flip?: boolean;
}) {
  const { isRTL } = useTranslation();
  
  return (
    <span className={`${className} ${isRTL && flip ? 'icon-flip' : ''}`}>
      {children}
    </span>
  );
} 