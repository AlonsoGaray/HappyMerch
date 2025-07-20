import { useHorizontalDragScroll, useSafeItemSelect } from '../utils/ScrollUtils';
import React from 'react';
import { useGlobalData } from '../contexts/AdminDataContext';

type Background = {
  id: string;
  name: string;
  url: string;
  visible: boolean;
};

type BgSelectorProps = {
  selectedIdx: number;
  onSelect: (idx: number) => void;
};

const BgSelector: React.FC<BgSelectorProps> = ({ selectedIdx, onSelect }) => {
  const { data } = useGlobalData();
  const dragScroll = useHorizontalDragScroll();
  const safeSelect = useSafeItemSelect({
    onSelect,
    dragScroll,
  });

  // Filter only visible backgrounds
  const visibleBackgrounds = data.backgrounds.filter((bg: Background) => bg.visible);

  if (data.loading) {
    return (
      <div className="flex gap-8 h-44 max-h-44 items-center justify-center w-full">
        <span className="text-white/70">Cargando fondos...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex gap-8 h-44 max-h-44 items-center justify-center w-full">
        <span className="text-red-400">Error: {data.error}</span>
      </div>
    );
  }

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
      {visibleBackgrounds.length === 0 && <span className="text-white/70">No hay fondos disponibles</span>}
      {visibleBackgrounds.map((bg: Background, idx) => (
        <button
          key={bg.id}
          className={`rounded-lg p-1 transition ${selectedIdx === idx ? 'ring-4 ring-pink-300' : ''}`}
          onMouseDown={e => safeSelect.handleMouseDown(e, idx)}
          onMouseUp={e => safeSelect.handleMouseUp(e, idx)}
          onTouchStart={e => safeSelect.handleTouchStart(e, idx)}
          onTouchEnd={e => safeSelect.handleTouchEnd(e, idx)}
        >
          <img
            src={bg.url}
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