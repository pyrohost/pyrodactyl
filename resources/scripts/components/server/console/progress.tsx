import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress: React.FC<ProgressProps> = ({ value, className, indicatorClassName }) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-2 w-full bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-in-out ${indicatorClassName}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};

export default Progress;