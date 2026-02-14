import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>}
            <div className="relative group">
                <select
                    className={`
                        w-full px-4 py-3.5 rounded-xl border border-gray-200 
                        bg-gray-50/50 text-gray-900 appearance-none font-medium
                        focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 focus:bg-white
                        transition-all duration-200 cursor-pointer
                        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    <option value="" disabled>Select an option</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <ChevronDown size={20} />
                </div>
            </div>
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
    );
};
