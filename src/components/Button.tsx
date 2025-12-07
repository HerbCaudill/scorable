import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

    const variants = {
      primary: 'bg-black text-white hover:bg-gray-900 focus:ring-gray-500',
      secondary: 'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-400',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  }
)

Button.displayName = 'Button'
