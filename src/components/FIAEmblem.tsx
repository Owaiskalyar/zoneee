import React from 'react';

interface FIAEmblemProps {
  className?: string;
  size?: number;
}

export const FIAEmblem: React.FC<FIAEmblemProps> = ({ className = '', size = 44 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Ring */}
        <circle cx="50" cy="50" r="47" stroke="#D97706" strokeWidth="2.5" className="text-amber-500" />
        <circle cx="50" cy="50" r="43" fill="#0B132B" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="38" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" />

        {/* Heraldic Laurel Leaves / Wreath */}
        <path
          d="M20 52 C18 40 25 28 35 22 C32 28 32 38 34 46"
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M80 52 C82 40 75 28 65 22 C68 28 68 38 66 46"
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M23 58 C26 68 34 76 45 80 C40 74 38 66 35 58"
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M77 58 C74 68 66 76 55 80 C60 74 62 66 65 58"
          stroke="#F59E0B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Central Scales of Justice */}
        {/* Pillar */}
        <line x1="50" y1="28" x2="50" y2="68" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Base */}
        <path d="M42 68 L58 68 L55 72 L45 72 Z" fill="#D97706" stroke="#FDE68A" strokeWidth="1" />
        {/* Balance Beam */}
        <line x1="33" y1="36" x2="67" y2="36" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="36" r="2.5" fill="#F59E0B" />
        
        {/* Left Pan */}
        <line x1="33" y1="36" x2="28" y2="48" stroke="#FDE68A" strokeWidth="1" />
        <line x1="33" y1="36" x2="38" y2="48" stroke="#FDE68A" strokeWidth="1" />
        <path d="M26 48 C28 53 38 53 40 48 Z" fill="#F59E0B" opacity="0.9" />

        {/* Right Pan */}
        <line x1="67" y1="36" x2="62" y2="48" stroke="#FDE68A" strokeWidth="1" />
        <line x1="67" y1="36" x2="72" y2="48" stroke="#FDE68A" strokeWidth="1" />
        <path d="M60 48 C62 53 72 53 74 48 Z" fill="#F59E0B" opacity="0.9" />

        {/* Federal Star */}
        <polygon
          points="50,18 52,23 57,23 53,26 55,31 50,28 45,31 47,26 43,23 48,23"
          fill="#FDE68A"
        />

        {/* Banner Text Curves */}
        <path id="curveTop" d="M 22 50 A 28 28 0 0 1 78 50" fill="none" />
      </svg>
    </div>
  );
};
