import { Eye, LockKeyhole, LockKeyholeOpen, SquareSplitHorizontal, StretchHorizontal, Trash } from 'lucide-react';
import React from 'react';

interface CanvasImageItem {
  id: number;
  src: string;
}
interface CanvasTextItem {
  id: number;
  type: 'text';
  text: string;
  font: string;
  color: string;
}
type CanvasAnyItem = CanvasImageItem | CanvasTextItem;

interface SidebarProps {
  selectedId: number | null;
  canvasItems: CanvasAnyItem[];
  setSelectedId: (id: number | null) => void;
  onDeleteItem: (id: number) => void;
  onMoveItem: (id: number, direction: 'up' | 'down') => void;
  onRotate: (id: number, angle: number) => void;
  onFlipX: (id: number) => void;
  onCenter: (id: number) => void;
  onResize: (id: number, factor: number) => void;
  onLockToggle: (id: number) => void;
  isLocked: (id: number) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedId,
  canvasItems,
  setSelectedId,
  onDeleteItem,
  onMoveItem,
  onRotate,
  onFlipX,
  onCenter,
  onResize,
  onLockToggle,
  isLocked,
}) => (
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
        <button className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-full text-xl mb-1 shadow" onClick={() => onResize(selectedId, 1.15)} title="Agrandar">
          ➕
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-full text-xl mb-2 shadow" onClick={() => onResize(selectedId, 0.85)} title="Reducir">
          ➖
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-1 shadow" onClick={() => onMoveItem(selectedId, 'up')} title="Subir capa">
          ⬆️
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-2 shadow" onClick={() => onMoveItem(selectedId, 'down')} title="Bajar capa">
          ⬇️
        </button>
      </div>
    )}
    {/* Lista de capas */}
    <div className="flex flex-col gap-1 items-center">
      {canvasItems.length === 0 && <span className="text-xs text-gray-400">Sin capas</span>}
      {canvasItems.map(item => (
        <button
          key={item.id}
          className={`w-24 h-27 flex flex-col items-center pt-0.5 justify-between rounded border ${selectedId === item.id ? 'border-pink-500 bg-pink-100' : 'border-gray-300 bg-gray-200'} transition`}
          onClick={() => setSelectedId(item.id)}
        >
          <StretchHorizontal size={17} color="white" fill='white' />
          {('src' in item) ? (
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
            <Eye size={17} color="white" />
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
                if (selectedId === item.id) setSelectedId(null); 
              }}
              title="Borrar"
            >
              <Trash size={17} color="white" />
            </button>
          </div>
        </button>
      )).reverse()}
    </div>
  </div>
);

export default Sidebar; 