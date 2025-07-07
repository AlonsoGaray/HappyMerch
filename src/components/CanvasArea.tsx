import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Image } from 'fabric';
import type { CanvasItem } from '../types';

type CanvasAreaProps = {
  product: {
    name: string;
    image: string;
    canvas: { width: number; height: number; left: number; top: number };
    imageWidth: number;
    imageHeight: number;
  };
  items?: CanvasItem[];
  onDeleteItem?: (id: number) => void;
  onMoveItem?: (id: number, direction: 'up' | 'down') => void;
};

const DEFAULT_SIZE = 60;

const CanvasArea: React.FC<CanvasAreaProps> = ({ product, items = [], onDeleteItem, onMoveItem }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean } }>({});
  const fabricRef = useRef<Canvas | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

  // Calcular el factor de escala basado en el tamaño del contenedor visible
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current;
    const maxW = parent.offsetWidth;
    const maxH = parent.offsetHeight;
    // Usa el tamaño real de la imagen del producto
    const baseW = product.imageWidth;
    const baseH = product.imageHeight;
    // Escala máxima que cabe en el contenedor
    const scaleW = maxW / baseW;
    const scaleH = maxH / baseH;
    const newScale = Math.min(scaleW, scaleH, 1); // nunca mayor a 1
    setScale(newScale);
    setContainerDims({ width: baseW * newScale, height: baseH * newScale });
  }, [product]);

  // Actualiza el factor de escala al montar y al cambiar el tamaño
  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // Inicializar Fabric.js
  useEffect(() => {
    if (!canvasElRef.current) return;
    const fabricCanvas = new Canvas(canvasElRef.current, {
      width: product.canvas.width * scale,
      height: product.canvas.height * scale,
      selection: true,
    });
    fabricRef.current = fabricCanvas;
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
    fabricCanvas.renderAll();
    return () => {
      fabricCanvas.dispose();
    };
  }, [product.canvas.width, product.canvas.height, scale]);

  // Sincronizar items con Fabric
  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
    fabricCanvas.renderAll();
    items.forEach(async item => {
      const img = await Image.fromURL(item.src);
      // Aplica el factor de escala a la posición y tamaño
      img.set({
        left: ((itemStates[item.id]?.x ?? item.x) + ((img.width ?? DEFAULT_SIZE) / 2)) * scale,
        top: ((itemStates[item.id]?.y ?? item.y) + ((img.height ?? DEFAULT_SIZE) / 2)) * scale,
        scaleX: ((itemStates[item.id]?.size ?? DEFAULT_SIZE) / (img.width ?? DEFAULT_SIZE)) * scale,
        scaleY: ((itemStates[item.id]?.size ?? DEFAULT_SIZE) / (img.height ?? DEFAULT_SIZE)) * scale,
        angle: itemStates[item.id]?.rotation ?? 0,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        objectCaching: false,
        originX: 'center',
        originY: 'center',
        cornerStyle: 'circle',
        cornerColor: '#fff',
        cornerStrokeColor: '#fff',
      });
      (img as any).id = item.id;
      fabricCanvas.add(img);
      if (selectedId === item.id) {
        fabricCanvas.setActiveObject(img);
      }
      img.on('modified', () => {
        setItemStates(states => ({
          ...states,
          [item.id]: {
            x: ((img.left ?? 0) / scale) - ((img.width ?? DEFAULT_SIZE) / 2),
            y: ((img.top ?? 0) / scale) - ((img.height ?? DEFAULT_SIZE) / 2),
            size: ((img.scaleX ?? 1) * (img.width ?? DEFAULT_SIZE)) / scale,
            rotation: img.angle ?? 0,
            locked: itemStates[item.id]?.locked ?? false,
          },
        }));
      });
    });
    fabricCanvas.renderAll();

    // --- NUEVO: listeners globales de selección ---
    const handleSelection = (e: any) => {
      const obj = e.selected?.[0] || e.target;
      if (obj && typeof (obj as any).id === 'number') {
        setSelectedId((obj as any).id);
      }
    };
    const handleCleared = () => {
      setSelectedId(null);
    };
    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', handleCleared);
    // Limpieza
    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleCleared);
    };
  }, [items, itemStates, scale]);

  // Handlers de rotación y centrado (ajustados para escala)
  const handleRotate = (id: number, angle: number) => {
    setItemStates(states => ({
      ...states,
      [id]: { ...states[id], rotation: angle },
    }));
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        obj.set('angle', angle);
        fabricCanvas.renderAll();
      }
    }
  };
  const handleCenter = (id: number) => {
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        const centerX = (product.canvas.width * scale) / 2;
        const centerY = (product.canvas.height * scale) / 2;
        obj.set({ left: centerX, top: centerY });
        setItemStates(states => ({
          ...states,
          [id]: { ...states[id], x: (centerX / scale) - ((obj.width ?? DEFAULT_SIZE) / 2), y: (centerY / scale) - ((obj.height ?? DEFAULT_SIZE) / 2) },
        }));
        fabricCanvas.renderAll();
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <div
        ref={containerRef}
        className="relative flex justify-center items-center w-full h-full"
        style={{ width: '100%', height: '60vh', maxWidth: '100vw', maxHeight: '80vh' }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="absolute left-0 top-0 object-contain pointer-events-none select-none"
          draggable={false}
          style={{
            width: containerDims.width,
            height: containerDims.height,
            display: 'block',
            zIndex: 1,
          }}
          ref={imgRef}
        />
        <div
          className="absolute"
          style={{
            left: product.canvas.left * scale,
            top: product.canvas.top * scale,
            width: product.canvas.width * scale,
            height: product.canvas.height * scale,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div className="absolute left-0 top-0 w-full h-full border-2 border-dashed border-red-500 rounded z-10" />
          <canvas
            ref={canvasElRef}
            width={product.canvas.width * scale}
            height={product.canvas.height * scale}
            className="absolute left-0 top-0"
            style={{ zIndex: 2, background: 'transparent', pointerEvents: 'auto', width: '100%', height: '100%' }}
          />
        </div>
      </div>
      {/* Panel lateral de capas y controles */}
      <div className="absolute right-0 top-0 h-full flex flex-row bg-white/80 shadow-lg rounded-l-lg p-2 gap-2 z-20 min-w-[56px] items-center">
        {/* Controles para el elemento seleccionado */}
        {selectedId && itemStates[selectedId] && (
          <div className="flex flex-col gap-1 items-center mr-2">
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => handleRotate(selectedId, 0)}>Rotar 0°</button>
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => handleRotate(selectedId, 90)}>Rotar 90°</button>
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => handleRotate(selectedId, 180)}>Rotar 180°</button>
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => handleRotate(selectedId, 270)}>Rotar 270</button>
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1 mt-1" onClick={() => handleCenter(selectedId)}>Centrar</button>
            {/* Botones de agrandar y reducir */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-full text-xl mb-1 shadow"
              onClick={() => {
                const curr = itemStates[selectedId]?.size ?? DEFAULT_SIZE;
                const newSize = curr * 1.15;
                setItemStates(states => ({
                  ...states,
                  [selectedId]: { ...states[selectedId], size: newSize },
                }));
              }}
              title="Agrandar"
            >
              ➕
            </button>
            <button
              className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-full text-xl mb-2 shadow"
              onClick={() => {
                const curr = itemStates[selectedId]?.size ?? DEFAULT_SIZE;
                const newSize = Math.max(curr * 0.85, 10);
                setItemStates(states => ({
                  ...states,
                  [selectedId]: { ...states[selectedId], size: newSize },
                }));
              }}
              title="Reducir"
            >
              ➖
            </button>
            {/* Botón borrar */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-full text-xl mb-2 shadow"
              onClick={() => {
                if (typeof onDeleteItem === 'function' && selectedId) {
                  onDeleteItem(selectedId);
                }
              }}
              title="Borrar"
            >
              🗑️
            </button>
            {/* Botones subir/bajar capa */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-1 shadow"
              onClick={() => {
                if (typeof onMoveItem === 'function' && selectedId) {
                  onMoveItem(selectedId, 'up');
                }
              }}
              title="Subir capa"
            >
              ⬆️
            </button>
            <button
              className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-2 shadow"
              onClick={() => {
                if (typeof onMoveItem === 'function' && selectedId) {
                  onMoveItem(selectedId, 'down');
                }
              }}
              title="Bajar capa"
            >
              ⬇️
            </button>
            {/* Botón bloquear/desbloquear */}
            <button
              className={`w-9 h-9 flex items-center justify-center ${itemStates[selectedId]?.locked ? 'bg-yellow-500' : 'bg-gray-300'} text-white rounded-full text-xl mb-2 shadow`}
              onClick={() => {
                const fabricCanvas = fabricRef.current;
                if (fabricCanvas) {
                  const obj = fabricCanvas.getObjects().find(o => (o as any).id === selectedId);
                  if (obj) {
                    const locked = !itemStates[selectedId]?.locked;
                    obj.set({
                      lockMovementX: locked,
                      lockMovementY: locked,
                      lockScalingX: locked,
                      lockScalingY: locked,
                      lockRotation: locked,
                      selectable: !locked,
                    });
                    fabricCanvas.renderAll();
                    setItemStates(states => ({
                      ...states,
                      [selectedId]: { ...states[selectedId], locked },
                    }));
                  }
                }
              }}
              title={itemStates[selectedId]?.locked ? 'Desbloquear' : 'Bloquear'}
            >
              {itemStates[selectedId]?.locked ? '🔓' : '🔒'}
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 items-center">
          {items.length === 0 && <span className="text-xs text-gray-400">Sin capas</span>}
          {items.map(item => (
            <button
              key={item.id}
              className={`w-10 h-10 flex items-center justify-center rounded border ${selectedId === item.id ? 'border-pink-500 bg-pink-100' : 'border-gray-300 bg-white'} transition`}
              onClick={() => setSelectedId(item.id)}
            >
              <img src={item.src} alt="icon" className="w-7 h-7 object-contain" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CanvasArea; 