import React from 'react';

interface SidebarProps {
  selectedId: number | null;
  canvasItems: Array<{ id: number; src: string }>;
  setSelectedId: (id: number | null) => void;
  onDeleteItem: (id: number) => void;
  onMoveItem: (id: number, direction: 'up' | 'down') => void;
  onRotate: (id: number, angle: number) => void;
  onFlipX: (id: number) => void;
  onCenter: (id: number) => void;
  onResize: (id: number, factor: number) => void;
  onLockToggle?: (id: number) => void;
  isLocked?: (id: number) => boolean;
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
  <div className="fixed right-0 top-1/2 -translate-y-1/2 flex gap-2 items-center bg-white/80 shadow-lg rounded-l-lg p-2 min-w-[56px] z-20">
    {/* Controles para el ítem seleccionado */}
    {selectedId && (
      <div className="flex flex-col gap-1 items-center mr-2">
        <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => onRotate(selectedId, 0)}>
          Reset 0°
        </button>
        <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => onRotate(selectedId, 90)}>
          Rotate 90°
        </button>
        <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => onFlipX(selectedId)}>
          Flip X ↔️
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
        <button className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-full text-xl mb-2 shadow" onClick={() => { onDeleteItem(selectedId); setSelectedId(null); }} title="Borrar">
          🗑️
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-1 shadow" onClick={() => onMoveItem(selectedId, 'up')} title="Subir capa">
          ⬆️
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-2 shadow" onClick={() => onMoveItem(selectedId, 'down')} title="Bajar capa">
          ⬇️
        </button>
        {onLockToggle && isLocked && (
          <button
            className={`w-9 h-9 flex items-center justify-center ${isLocked(selectedId) ? 'bg-yellow-500' : 'bg-gray-300'} text-white rounded-full text-xl mb-2 shadow`}
            onClick={() => onLockToggle(selectedId)}
            title={isLocked(selectedId) ? 'Unlock' : 'Lock'}
          >
            {isLocked(selectedId) ? '🔓' : '🔒'}
          </button>
        )}
      </div>
    )}
    {/* Lista de capas */}
    <div className="flex flex-col gap-2 items-center">
      {canvasItems.length === 0 && <span className="text-xs text-gray-400">Sin capas</span>}
      {canvasItems.map(item => (
        <button
          key={item.id}
          className={`w-10 h-10 flex items-center justify-center rounded border ${selectedId === item.id ? 'border-pink-500 bg-pink-100' : 'border-gray-300 bg-white'} transition`}
          onClick={() => setSelectedId(item.id)}
        >
          <img src={item.src} alt="icon" className="w-7 h-7 object-contain" />
        </button>
      )).reverse()}
    </div>
  </div>
);

export default Sidebar; 