import React from 'react';
import { PizzaSlice as PizzaSliceType } from '../types/game';

interface PizzaSliceProps {
  slice: PizzaSliceType;
}

const PizzaSlice: React.FC<PizzaSliceProps> = ({ slice }) => {
  const topPercent = slice.lane * 25 + 6;

  return (
    <div
      className="absolute w-[10%] aspect-square transition-all duration-100 flex items-center justify-center"
      style={{
        left: `${slice.position}%`,
        top: `${topPercent}%`,
      }}
    >
      {/* White plate image underneath */}
      <img
        src="https://i.imgur.com/XFdXriH.png"
        alt="slice1plate"
        className="absolute inset-0 w-[80%] h-[80%] object-contain"
        style={{ zIndex: 1 }}
      />

    </div>
  );
};

export default PizzaSlice;
