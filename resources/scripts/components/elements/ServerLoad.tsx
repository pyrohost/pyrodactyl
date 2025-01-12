import React from 'react';

interface LogoLoaderProps {
    size?: string;
    className?: string;
  }

const LogoLoader: React.FC<LogoLoaderProps> = ({ size = '40px', className = '' }) => {
  return (
    <div style={{ width: size, height: size }} className='animate-pulse'>
      <svg viewBox="0 0 375 374.999991" className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          className="dark:stroke-white stroke-black"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          d="M 190.570312 171.863281 C 168.527344 188.328125 147.6875 201.871094 132.15625 210.230469 C 117.863281 217.914062 108.078125 221.222656 105.964844 218.394531 C 103.925781 215.664062 109.386719 207.714844 120.019531 196.839844 C 121.078125 195.753906 121.371094 194.128906 120.742188 192.75 C 120.730469 192.726562 120.71875 192.703125 120.710938 192.679688 C 119.664062 190.386719 116.695312 189.773438 114.847656 191.488281 C 86.8125 217.492188 70.867188 238.332031 75.75 244.871094 C 80.75 251.5625 106.367188 241.558594 140.496094 221.066406 C 141.734375 220.324219 143.296875 220.359375 144.484375 221.183594 C 168.546875 237.929688 201.582031 238.289062 226.359375 219.785156 C 257.675781 196.394531 258.179688 168.28125 253.285156 149.066406 C 250.460938 137.992188 244.605469 131.511719 190.570312 171.863281 Z"
          style={{
            strokeDasharray: 1000,
            animation: 'dashInOut 4s linear infinite'
          }}
        />
        <path
          className="dark:stroke-white stroke-black"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          d="M 293.171875 82.492188 C 288.066406 75.65625 261.507812 86.214844 226.339844 107.550781 C 202.136719 89.460938 167.996094 88.574219 142.554688 107.574219 C 116.292969 127.1875 112.238281 150.855469 114.128906 168.632812 C 115.445312 181.003906 120.433594 190.933594 174.601562 150.480469 C 196.300781 134.273438 216.832031 120.90625 232.28125 112.515625 C 246.960938 104.542969 257.054688 101.070312 259.207031 103.949219 C 261.09375 106.472656 256.558594 113.464844 247.449219 123.121094 C 245.429688 125.261719 245.046875 128.449219 246.421875 131.050781 C 246.445312 131.09375 246.46875 131.136719 246.488281 131.175781 C 248.59375 135.175781 253.964844 136.007812 257.246094 132.902344 C 283.300781 108.289062 297.863281 88.773438 293.171875 82.492188 Z"
          style={{
            strokeDasharray: 1000,
            animation: 'dashInOut 4s linear infinite'
          }}
        />
        <style>{`
          @keyframes dashInOut {
            0% {
              stroke-dashoffset: 1000;
            }
            50% {
              stroke-dashoffset: -1000;
            }
            100% {
              stroke-dashoffset: 1000;
            }
          }
        `}</style>
      </svg>
    </div>
  );
};

export default LogoLoader;