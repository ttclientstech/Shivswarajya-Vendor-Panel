import React from 'react';
import { Check } from 'lucide-react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    steps: string[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
    return (
        <div className="w-full mb-10">
            <div className="relative flex items-center justify-between mb-4">
                {/* Progress Track Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10" />

                {/* Active Progress Track */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full -z-10 transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center">
                            <div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300
                                    ${isActive
                                        ? 'bg-orange-500 border-orange-100 text-white shadow-lg shadow-orange-500/20 scale-110'
                                        : isCompleted
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'bg-white border-gray-100 text-gray-400'
                                    }
                                `}
                            >
                                {isCompleted ? <Check size={16} strokeWidth={3} /> : stepNum}
                            </div>
                            <span
                                className={`
                                    absolute -bottom-8 text-xs font-bold tracking-wider uppercase transition-colors duration-300 whitespace-nowrap
                                    ${isActive
                                        ? 'text-orange-600'
                                        : isCompleted
                                            ? 'text-gray-800'
                                            : 'text-gray-400'
                                    }
                                `}
                                style={{
                                    left: `${(index / (totalSteps - 1)) * 100}%`,
                                    transform: 'translateX(-50%)',
                                    bottom: '-2rem'
                                }}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Spacer for labels */}
            <div className="h-6" />
        </div>
    );
};
