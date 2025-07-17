import { useHorizontalDragScroll, useSafeItemSelect } from '../utils/ScrollUtils';
import React from 'react';

type Fondo = {
    name: string;
    image: string;
  };
  
  type BgSelectorProps = {
  fondos: Fondo[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
};

const BgSelector: React.FC<BgSelectorProps> = ({ fondos, selectedIdx, onSelect }) => {
  const dragScroll = useHorizontalDragScroll();
  const safeSelect = useSafeItemSelect({
    onSelect,
    dragScroll,
  });

  return (
    <div
      ref={dragScroll.scrollRef}
      className="flex gap-8 h-44 max-h-44 items-center w-full justify-center pl-14 overflow-x-auto cursor-grab active:cursor-grabbing select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onMouseDown={dragScroll.onMouseDown}
      onMouseMove={dragScroll.onMouseMove}
      onMouseUp={dragScroll.onMouseUp}
      onMouseLeave={dragScroll.onMouseLeave}
      onTouchStart={dragScroll.onTouchStart}
      onTouchMove={dragScroll.onTouchMove}
      onTouchEnd={dragScroll.onTouchEnd}
    >
      {/* Opción "Sin fondo" */}
      <button
        className={`rounded-lg p-1 transition ${selectedIdx === -1 ? 'ring-4 ring-pink-300' : ''}`}
        onMouseDown={e => safeSelect.handleMouseDown(e, -1)}
        onMouseUp={e => safeSelect.handleMouseUp(e, -1)}
        onTouchStart={e => safeSelect.handleTouchStart(e, -1)}
        onTouchEnd={e => safeSelect.handleTouchEnd(e, -1)}
      >
        <div className="w-28 h-28 bg-white rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-xs text-center">Sin fondo</span>
        </div>
      </button>
      {fondos.map((bg, idx) => (
        <button
          key={bg.image}
          className={`rounded-lg p-1 transition ${selectedIdx === idx ? 'ring-4 ring-pink-300' : ''}`}
          onMouseDown={e => safeSelect.handleMouseDown(e, idx)}
          onMouseUp={e => safeSelect.handleMouseUp(e, idx)}
          onTouchStart={e => safeSelect.handleTouchStart(e, idx)}
          onTouchEnd={e => safeSelect.handleTouchEnd(e, idx)}
        >
          <img
            src={bg.image}
            alt={bg.name}
            className="w-28 h-28 object-contain bg-white rounded-lg"
            draggable={false}
          />
        </button>
      ))}
    </div>
  );
};
  
  export default BgSelector; 