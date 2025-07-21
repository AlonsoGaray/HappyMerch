import { useHorizontalDragScroll, useSafeItemSelect } from '../utils/ScrollUtils';
import React from 'react';
import { useGlobalData } from '../contexts/AdminDataContext';

type Element = {
  id: string;
  name: string;
  url: string;
  visible: boolean;
};

type ElementSelectorProps = {
  onSelect?: (element: Element) => void;
};

const ElementSelector: React.FC<ElementSelectorProps> = ({ onSelect }) => {
  const { data } = useGlobalData();
  const dragScroll = useHorizontalDragScroll();
  const safeSelect = useSafeItemSelect({
    onSelect: (idx) => onSelect && onSelect(visibleElements[idx]),
    dragScroll,
  });

  // Filter only visible elements
  const visibleElements = data.elements.filter((element: Element) => element.visible);

  if (data.loading) {
    return (
      <div className="flex gap-5 h-44 max-h-44 items-center justify-center w-full">
        <span className="text-white/70">Cargando elementos...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex gap-5 h-44 max-h-44 items-center justify-center w-full">
        <span className="text-red-400">Error: {data.error}</span>
      </div>
    );
  }

  return (
    <div
      ref={dragScroll.scrollRef}
      className="flex gap-5 h-44 max-h-44 items-center overflow-auto w-full justify-start cursor-grab active:cursor-grabbing select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onMouseDown={dragScroll.onMouseDown}
      onMouseMove={dragScroll.onMouseMove}
      onMouseUp={dragScroll.onMouseUp}
      onMouseLeave={dragScroll.onMouseLeave}
      onTouchStart={dragScroll.onTouchStart}
      onTouchMove={dragScroll.onTouchMove}
      onTouchEnd={dragScroll.onTouchEnd}
    >
      {visibleElements.length === 0 && <span className="text-white/70">No hay elementos disponibles</span>}
      {visibleElements.map((el: Element, idx) => (
        <div
          key={el.id}
          className="flex flex-col items-center cursor-pointer"
          onMouseDown={e => safeSelect.handleMouseDown(e, idx)}
          onMouseUp={e => safeSelect.handleMouseUp(e, idx)}
          onTouchStart={e => safeSelect.handleTouchStart(e, idx)}
          onTouchEnd={e => safeSelect.handleTouchEnd(e, idx)}
        >
          <div className="rounded-lg bg-white p-4 shadow-md w-28 h-28 flex items-center justify-center">
            <img src={el.url} alt={el.name} className="object-contain max-w-full max-h-full" draggable={false} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ElementSelector; 