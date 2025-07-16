import { Grid3x2, RefreshCcw, RotateCw } from 'lucide-react';
import React from 'react';

interface LeftSidebarProps {
  selectedId: number | null;
  onCenter: (id: number) => void;
  onRotate: (id: number, angle: number) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  selectedId,
  onCenter,
  onRotate
}) => {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-10 flex flex-col justify-around z-50 gap-12">
      <button 
        className='rounded-full bg-black p-2 disabled:bg-gray-500'
        disabled={selectedId === null}
        onClick={() => { if (selectedId !== null) onCenter(selectedId); }}
        title="Flip horizontal"
      >
        <Grid3x2 color="white" />
      </button>
      <button 
        className='rounded-full bg-black p-2 disabled:bg-gray-500'
        disabled={selectedId === null}
        onClick={() => { if (selectedId !== null) onRotate(selectedId, -999); }}
      >
        <RefreshCcw color='white'/>
      </button>
      <button 
        className='rounded-full bg-black p-2 disabled:bg-gray-500'
        disabled={selectedId === null}
        onClick={() => { if (selectedId !== null) onRotate(selectedId, 90); }}
      >
        <RotateCw color='white'/>
      </button>
    </div>
  );
};

export default LeftSidebar; 