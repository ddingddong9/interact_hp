import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'outline';
  size?: 'default' | 'icon';
};

export function Button({
  variant = 'outline',
  size = 'default',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`ui-button ${variant} ${size} ${className}`}
      {...props}
    />
  );
}
