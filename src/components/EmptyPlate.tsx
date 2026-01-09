import React from 'react';
import { EmptyPlate as EmptyPlateType } from '../types/game';

interface EmptyPlateProps {
  plate: EmptyPlateType;
}

const EmptyPlate: React.FC<EmptyPlateProps> = ({ plate }) => {
  const topPercent = plate.lane * 25 + 6;

  return (
    <div
      className="absolute w-[10%] aspect-square transition-all duration-100 flex items-center justify-center"
      style={{
        left: `${plate.position}%`,
        top: `${topPercent}%`,
      }}
    >
      {/* Empty plate image */}
      <img
        src="https://i.imgur.com/vUT4nnz.png"
        alt="empty plate"
        className="absolute inset-0 w-[80%] h-[80%] object-contain"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

export default EmptyPlate;
