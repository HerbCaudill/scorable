import React from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-black mb-1">{label}</label>}
        <select
          ref={ref}
          className={`w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none cursor-pointer ${className}`}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
