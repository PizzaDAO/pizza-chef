// src/components/MafiaSlice.tsx
import React from 'react';
import { MafiaSlice as MafiaSliceType } from '../types/game';

interface MafiaSliceProps {
  slice: MafiaSliceType;
}

const MafiaSlice: React.FC<MafiaSliceProps> = ({ slice }) => {
  // Calculate rotation based on velocity direction
  const rotation = Math.atan2(slice.speedY, slice.speedX) * (180 / Math.PI);

  // Position based on lane (fractional) and position (percentage)
  const xPct = slice.position;
  const yPct = slice.lane * 25 + 6;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `rotate(${rotation}deg)`,
        fontSize: 'clamp(1.25rem, 3vw, 2rem)',
        zIndex: 15,
        transition: 'left 50ms linear, top 50ms linear',
      }}
    >
      🍕
    </div>
  );
};

export default MafiaSlice;
