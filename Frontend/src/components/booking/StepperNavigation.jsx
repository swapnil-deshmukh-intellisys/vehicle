import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../context/ThemeContext';
import { ColorPalette } from '../../constants/designSystem';

const StepperNavigation = ({ steps, activeStep, onStepClick }) => {
  const { theme } = useTheme();
  return (
    <div className="w-full relative overflow-x-hidden">
      <div className="flex items-start relative">
        {/* Connector Lines - positioned absolutely between circles */}
        {steps.map((step, index) => {
          if (index < steps.length - 1) {
            const isCompleted = index < activeStep;
            return (
              <div
                key={`connector-${index}`}
                className={`absolute h-1 top-5 transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30' 
                    : theme === 'light'
                    ? 'bg-gray-200/50'
                    : 'bg-gray-700/50'
                }`}
                style={{
                  left: `${(index + 0.5) * (100 / steps.length)}%`,
                  width: `${100 / steps.length}%`,
                  transform: 'translateX(0)'
                }}
              />
            );
          }
          return null;
        })}
        
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isClickable = index <= activeStep;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center relative z-10">
              {/* Step Circle - perfectly centered */}
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg ${
                  isCompleted
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/50'
                    : isActive
                    ? `bg-gradient-to-br ${ColorPalette.primary.gradient} text-white ring-4 ring-red-500/30 shadow-red-500/50`
                    : theme === 'light'
                    ? 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-600'
                    : 'bg-gray-800/80 backdrop-blur-sm border-2 border-gray-700 text-gray-400'
                } ${
                  isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-xl' : 'cursor-not-allowed'
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  index + 1
                )}
              </button>
              
              {/* Step Label - perfectly centered below circle */}
              <div className="mt-4">
                <p
                  className={`text-[10px] sm:text-xs md:text-sm font-semibold text-center transition-colors duration-300 ${
                    isActive
                      ? theme === 'light' ? 'text-gray-900' : 'text-white'
                      : isCompleted
                      ? 'text-emerald-600'
                      : theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-500'
                  }`}
                >
                  {step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepperNavigation;

