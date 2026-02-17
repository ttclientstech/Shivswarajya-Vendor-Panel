import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>}
            <div className="relative group">
                <input
                    className={`
                        w-full px-4 py-3.5 rounded-xl border 
                        ${error ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'}
                        text-gray-900 placeholder-gray-400 font-medium
                        focus:outline-none focus:ring-4 
                        ${error ? 'focus:ring-red-500/10 focus:border-red-500' : 'focus:ring-orange-500/10 focus:border-orange-500/50'}
                        focus:bg-white
                        transition-all duration-200
                        ${icon ? 'pr-12' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {icon && (
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-orange-500'}`}>
                        {icon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-sm text-red-600 ml-1 flex items-center gap-1">
                    <span className="text-red-500">⚠</span> {error}
                </p>
            )}
        </div>
    );
};
