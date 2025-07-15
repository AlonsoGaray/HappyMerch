import { Eye, EyeOff, LockKeyhole, LockKeyholeOpen, SquareSplitHorizontal, StretchHorizontal, Trash } from 'lucide-react';
import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
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

interface RightSidebarProps {
  selectedId: number | null;
  canvasItems: CanvasAnyItem[];
  setSelectedId: (id: number | null) => void;
  onDeleteItem: (id: number) => void;
  onMoveItem: (id: number, direction: 'up' | 'down') => void;
  onRotate: (id: number, angle: number) => void;
  onFlipX: (id: number) => void;
  onCenter: (id: number) => void;
  onLockToggle: (id: number) => void;
  isLocked: (id: number) => boolean;
  onToggleVisible: (id: number) => void;
  isVisible: (id: number) => boolean;
  onReorderItems: (newOrder: CanvasAnyItem[]) => void;
}

function SortableLayer({ item, selectedId, setSelectedId, onFlipX, onToggleVisible, isVisible, onLockToggle, isLocked, onDeleteItem }: any) {
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
    width: '100%',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-24 h-27 flex flex-col items-center pt-0.5 justify-between rounded border ${selectedId === item.id ? 'border-pink-500 bg-pink-100' : 'border-gray-300 bg-gray-200'} transition`}
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
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedId,
  canvasItems,
  setSelectedId,
  onDeleteItem,
  onMoveItem,
  onRotate,
  onFlipX,
  onCenter,
  onLockToggle,
  isLocked,
  onToggleVisible,
  isVisible,
  onReorderItems,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = canvasItems.findIndex(i => i.id === active.id);
      const newIndex = canvasItems.findIndex(i => i.id === over.id);
      const newOrder = arrayMove(canvasItems, oldIndex, newIndex);
      onReorderItems(newOrder);
    }
  }

  return (
    <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-2 items-center bg-white/80 shadow-lg rounded-lg p-2 min-w-[56px] z-20">
      {/* Controles para el ítem seleccionado */}
      {selectedId && (
        <div className="flex flex-col gap-1 items-center mr-2">
          <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => onRotate(selectedId, -999)}>
            Reset 0°
          </button>
          <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => onRotate(selectedId, 90)}>
            Rotate 90°
          </button>
          <button className="text-xs bg-pink-500 text-white rounded px-2 py-1 mt-1" onClick={() => onCenter(selectedId)}>
            Centrar
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-1 shadow" onClick={() => onMoveItem(selectedId, 'up')} title="Subir capa">
            ⬆️
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-2 shadow" onClick={() => onMoveItem(selectedId, 'down')} title="Bajar capa">
            ⬇️
          </button>
        </div>
      )}
      {/* Lista de capas con drag and drop */}
      <div className="flex flex-col gap-1 items-center w-full">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={canvasItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {canvasItems.length === 0 && <span className="text-xs text-gray-400">Sin capas</span>}
            {canvasItems.map(item => (
              <SortableLayer
                key={item.id}
                item={item}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onFlipX={onFlipX}
                onToggleVisible={onToggleVisible}
                isVisible={isVisible}
                onLockToggle={onLockToggle}
                isLocked={isLocked}
                onDeleteItem={onDeleteItem}
              />
            )).reverse()}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default RightSidebar; 