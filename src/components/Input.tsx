import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-black mb-1">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${className}`}
          {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
