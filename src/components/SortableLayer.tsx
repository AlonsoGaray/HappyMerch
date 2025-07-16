import React from 'react';
import { Eye, EyeOff, LockKeyhole, LockKeyholeOpen, SquareSplitHorizontal, StretchHorizontal, Trash } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CanvasItem } from '../types';

type CanvasTextItem = {
  id: number;
  type: 'text';
  text: string;
  font: string;
  color: string;
  x: number;
  y: number;
};
type CanvasAnyItem = CanvasItem | CanvasTextItem;

interface SortableLayerProps {
  item: CanvasAnyItem;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  onFlipX: (id: number) => void;
  onToggleVisible: (id: number) => void;
  isVisible: (id: number) => boolean;
  onLockToggle: (id: number) => void;
  isLocked: (id: number) => boolean;
  onDeleteItem: (id: number) => void;
}

const SortableLayer: React.FC<SortableLayerProps> = ({ item, selectedId, setSelectedId, onFlipX, onToggleVisible, isVisible, onLockToggle, isLocked, onDeleteItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : 1,
    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
    border: isOver && !isDragging ? '2px solid #ec4899' : undefined, // pink-500
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-24 h-28 flex flex-col items-center pt-0.5 justify-between rounded border ${selectedId === item.id ? 'border-pink-500 bg-pink-100' : 'border-gray-300 bg-gray-200'} transition`}
      onClick={() => setSelectedId(item.id)}
    >
      <button {...attributes} {...listeners} data-dnd-kit-drag-handle><StretchHorizontal size={17} color="white" fill='white' /></button>
      {'src' in item ? (
        <img src={item.src} alt="icon" className="w-14 h-14 object-contain" />
      ) : (
        <span
          className={`w-14 h-14 flex items-center justify-center text-2xl overflow-hidden ${(item as CanvasTextItem).font || ''}`}
          style={{ color: (item as CanvasTextItem).color }}
          title={(item as CanvasTextItem).text}
        >
          {(item as CanvasTextItem).text}
        </span>
      )}
      <div className='flex bg-gray-500 w-full h-6 rounded-b items-center justify-around px-0.5'>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onFlipX(item.id);
          }}
          title="Flip horizontal"
        >
          <SquareSplitHorizontal size={17} color="white" />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onToggleVisible(item.id);
          }}
          title={isVisible(item.id) ? 'Ocultar' : 'Mostrar'}
        >
          {isVisible(item.id) ? <Eye size={17} color="white" /> : <EyeOff size={17} color="white" />}
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onLockToggle(item.id); 
          }}
          title={isLocked(item.id) ? 'Unlock' : 'Lock'}
        >
          {isLocked(item.id) ? <LockKeyhole size={17} color="white" /> : <LockKeyholeOpen size={17} color="white" />}
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onDeleteItem(item.id); 
          }}
          title="Borrar"
        >
          <Trash size={17} color="white" />
        </button>
      </div>
    </div>
  );
};

export default SortableLayer; 