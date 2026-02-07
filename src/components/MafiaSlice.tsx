// src/components/MafiaSlice.tsx
import React from 'react';
import { MafiaSlice as MafiaSliceType } from '../types/game';
import { sprite } from '../lib/assets';

const slicePlateImg = sprite("slice-plate.png");

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
      className="absolute pointer-events-none w-[6%] aspect-square flex items-center justify-center"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        zIndex: 15,
        transition: 'left 50ms linear, top 50ms linear',
      }}
    >
      <img
        src={slicePlateImg}
        alt="mafia slice"
        className="w-full h-full object-contain"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </div>
  );
};

export default MafiaSlice;
