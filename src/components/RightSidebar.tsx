import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, MeasuringStrategy } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { CanvasItem } from '../types';
import SortableLayer from './SortableLayer';

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
  onFlipX: (id: number) => void;
  onLockToggle: (id: number) => void;
  isLocked: (id: number) => boolean;
  onToggleVisible: (id: number) => void;
  isVisible: (id: number) => boolean;
  onReorderItems: (newOrder: CanvasAnyItem[]) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedId,
  canvasItems,
  setSelectedId,
  onDeleteItem,
  onFlipX,
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
  
    if (!over || active.id === over.id) return;
  
    const oldIndex = canvasItems.findIndex(i => i.id === active.id);
    const newIndex = canvasItems.findIndex(i => i.id === over.id);
  
    if (oldIndex === -1 || newIndex === -1) return;
  
    // OJO: debemos usar reversed canvasItems aquí también
    const reversedItems = [...canvasItems].reverse();
    const reversedOldIndex = reversedItems.findIndex(i => i.id === active.id);
    const reversedNewIndex = reversedItems.findIndex(i => i.id === over.id);
  
    const newReversedOrder = arrayMove(reversedItems, reversedOldIndex, reversedNewIndex);
  
    const newCanvasItems = [...newReversedOrder].reverse(); // revertir para mantener el orden original
  
    onReorderItems(newCanvasItems);
  }
  

  const reversedItems = [...canvasItems].reverse(); 

  return (
    <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-2 items-center bg-white/80 shadow-lg rounded-lg p-2 min-w-[56px] z-20">
      {/* Lista de capas con drag and drop */}
      <div className="flex flex-col gap-1 items-center w-full max-h-96 px-1 overflow-auto">
        <DndContext measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement ]}>
          <SortableContext items={reversedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {reversedItems.length === 0 && <span className="text-xs text-gray-400">Sin capas</span>}
            {reversedItems.map(item => (
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
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default RightSidebar; 