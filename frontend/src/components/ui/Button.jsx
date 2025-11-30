// frontend/src/components/ui/Button.jsx
import React from 'react';
export default function Button({ children, variant='primary', className = '', ...props }) {
  const base = 'btn';
  const v = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  return <button className={`${base} ${v} ${className}`} {...props}>{children}</button>;
}
