import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    className = '',
    ...props
}) => {
    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>}
            <div className="relative group">
                <input
                    className={`
                        w-full px-4 py-3.5 rounded-xl border border-gray-200 
                        bg-gray-50/50 text-gray-900 placeholder-gray-400 font-medium
                        focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 focus:bg-white
                        transition-all duration-200
                        ${icon ? 'pr-12' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};
