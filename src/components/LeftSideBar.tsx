import { Redo, SquareSplitHorizontal, Undo } from 'lucide-react';
import React from 'react';

interface LeftSidebarProps {
  selectedId: number | null;
  onFlipX: (id: number) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  selectedId,
  onFlipX,
}) => (
  <div
    className="absolute top-1/2 -translate-y-1/2 left-10 flex flex-col justify-around z-50 gap-12"
  >
    <button 
      className='rounded-full bg-black p-2 disabled:bg-gray-500'
      disabled={!selectedId}
      onClick={() => { 
        if (selectedId !== null) onFlipX(selectedId);
      }}
      title="Flip horizontal"
    >
      <SquareSplitHorizontal color="white" />
    </button>
    <button 
      className='rounded-full bg-black p-2 disabled:bg-gray-500'
      disabled={!selectedId}
    >
      <Undo color='white'/>
    </button>
    <button 
      className='rounded-full bg-black p-2 disabled:bg-gray-500'
      disabled={!selectedId}
    >
      <Redo color='white'/>
    </button>
  </div>
);

export default LeftSidebar; 