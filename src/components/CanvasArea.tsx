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
  selectedId?: number | null;
  setSelectedId?: (id: number | null) => void;
};

const DEFAULT_SIZE = 60;

// CanvasArea component renders the product image, a canvas for editing, and a sidebar for layer controls.
const CanvasArea: React.FC<CanvasAreaProps> = ({ product, items = [], onDeleteItem, onMoveItem, selectedId, setSelectedId }) => {
  // Use controlled selectedId if provided
  const isControlled = typeof selectedId !== 'undefined' && typeof setSelectedId === 'function';
  const [internalSelectedId, internalSetSelectedId] = useState<number | null>(null);
  const actualSelectedId = isControlled ? selectedId : internalSelectedId;
  const actualSetSelectedId = isControlled ? setSelectedId! : internalSetSelectedId;
  // State for item properties (position, size, rotation, lock status)
  const [itemStates, setItemStates] = useState<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean } }>({});
  // Fabric.js canvas reference
  const fabricRef = useRef<Canvas | null>(null);
  // Canvas DOM element reference
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // Product image reference
  const imgRef = useRef<HTMLImageElement>(null);
  // Container div reference
  const containerRef = useRef<HTMLDivElement>(null);
  // Scale factor for responsive canvas
  const [scale, setScale] = useState(1);
  // Container dimensions for scaling
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

  /**
   * Calculate and update the scale factor based on the container size and product image size.
   */
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current;
    const maxW = parent.offsetWidth;
    const maxH = parent.offsetHeight;
    const baseW = product.imageWidth;
    const baseH = product.imageHeight;
    // Find the maximum scale that fits the container, but never greater than 1
    const scaleW = maxW / baseW;
    const scaleH = maxH / baseH;
    const newScale = Math.min(scaleW, scaleH, 1);
    setScale(newScale);
    setContainerDims({ width: baseW * newScale, height: baseH * newScale });
  }, [product]);

  // Update scale on mount and when window resizes
  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  /**
   * Initialize Fabric.js canvas when the component mounts or when canvas size/scale changes.
   */
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

  /**
   * Sync items with Fabric.js canvas. Handles adding images, updating their properties, and selection events.
   */
  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
    fabricCanvas.renderAll();
    items.forEach(async item => {
      const img = await Image.fromURL(item.src);
      // Apply scale to position and size
      img.set({
        left: ((itemStates[item.id]?.x ?? item.x) + ((img.width ?? DEFAULT_SIZE) / 2)) * scale,
        top: ((itemStates[item.id]?.y ?? item.y) + ((img.height ?? DEFAULT_SIZE) / 2)) * scale,
        scaleX: ((itemStates[item.id]?.size ?? DEFAULT_SIZE) / (img.width ?? DEFAULT_SIZE)) * scale,
        scaleY: ((itemStates[item.id]?.size ?? DEFAULT_SIZE) / (img.height ?? DEFAULT_SIZE)) * scale,
        angle: itemStates[item.id]?.rotation ?? 0,
        selectable: !(itemStates[item.id]?.locked),
        hasControls: !(itemStates[item.id]?.locked),
        lockMovementX: !!itemStates[item.id]?.locked,
        lockMovementY: !!itemStates[item.id]?.locked,
        lockScalingX: !!itemStates[item.id]?.locked,
        lockScalingY: !!itemStates[item.id]?.locked,
        lockRotation: !!itemStates[item.id]?.locked,
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
      if (actualSelectedId === item.id) {
        fabricCanvas.setActiveObject(img);
      }
      // Update item state when modified on canvas
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

    // Selection event listeners for updating selectedId
    const handleSelection = (e: any) => {
      const obj = e.selected?.[0] || e.target;
      if (obj && typeof (obj as any).id === 'number') {
        actualSetSelectedId((obj as any).id);
      }
    };
    const handleCleared = () => {
      actualSetSelectedId(null);
    };
    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', handleCleared);
    // Cleanup listeners on unmount
    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleCleared);
    };
  }, [items, itemStates, scale, actualSelectedId]);

  // Ensure every item has an entry in itemStates so the action bar appears immediately
  useEffect(() => {
    setItemStates(prev => {
      const updated = { ...prev };
      let changed = false;
      items.forEach(item => {
        if (!updated[item.id]) {
          updated[item.id] = {
            x: item.x,
            y: item.y,
            size: DEFAULT_SIZE,
            rotation: 0,
            locked: false,
          };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [items]);

  /**
   * Handler to rotate an item to a specific angle (degrees)
   */
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

  /**
   * Handler to center an item within the canvas area
   */
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
      {/* Product image and canvas area */}
      <div
        ref={containerRef}
        className="relative flex justify-center items-center w-full h-full"
        style={{ width: '100%', height: '60vh', maxWidth: '100vw', maxHeight: '80vh' }}
      >
        {/* Product image as background */}
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
        {/* Canvas overlay area */}
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
          {/* Dashed border for printable area */}
          <div className="absolute left-0 top-0 w-full h-full border-2 border-dashed border-red-500 rounded z-10" />
          {/* Fabric.js canvas */}
          <canvas
            ref={canvasElRef}
            width={product.canvas.width * scale}
            height={product.canvas.height * scale}
            className="absolute left-0 top-0"
            style={{ zIndex: 2, background: 'transparent', pointerEvents: 'auto', width: '100%', height: '100%' }}
          />
        </div>
      </div>
      {/* Sidebar: layer controls and actions */}
      <div className="absolute right-0 top-0 h-full flex flex-row bg-white/80 shadow-lg rounded-l-lg p-2 gap-2 z-20 min-w-[56px] items-center">
        {/* Controls for the selected item */}
        {actualSelectedId && itemStates[actualSelectedId] && (
          <div className="flex flex-col gap-1 items-center mr-2">
            {/* Reset rotation button */}
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1" onClick={() => handleRotate(actualSelectedId, 0)}>
              Reset 0°
            </button>
            {/* Rotate 90° right button */}
            <button
              className="text-xs bg-pink-500 text-white rounded px-2 py-1"
              onClick={() => {
                const current = itemStates[actualSelectedId]?.rotation ?? 0;
                const next = (current + 90) % 360;
                handleRotate(actualSelectedId, next);
              }}
            >
              Rotate 90°
            </button>
            {/* Flip horizontal button */}
            <button
              className="text-xs bg-pink-500 text-white rounded px-2 py-1"
              onClick={() => {
                const fabricCanvas = fabricRef.current;
                if (fabricCanvas) {
                  const obj = fabricCanvas.getObjects().find(o => (o as any).id === actualSelectedId);
                  if (obj) {
                    obj.set('flipX', !obj.flipX);
                    fabricCanvas.renderAll();
                  }
                }
              }}
            >
              Flip X ↔️
            </button>
            {/* Center button */}
            <button className="text-xs bg-pink-500 text-white rounded px-2 py-1 mt-1" onClick={() => handleCenter(actualSelectedId)}>Centrar</button>
            {/* Enlarge button */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-full text-xl mb-1 shadow"
              onClick={() => {
                const curr = itemStates[actualSelectedId]?.size ?? DEFAULT_SIZE;
                const newSize = curr * 1.15;
                setItemStates(states => ({
                  ...states,
                  [actualSelectedId]: { ...states[actualSelectedId], size: newSize },
                }));
              }}
              title="Agrandar"
            >
              ➕
            </button>
            {/* Shrink button */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-full text-xl mb-2 shadow"
              onClick={() => {
                const curr = itemStates[actualSelectedId]?.size ?? DEFAULT_SIZE;
                const newSize = Math.max(curr * 0.85, 10);
                setItemStates(states => ({
                  ...states,
                  [actualSelectedId]: { ...states[actualSelectedId], size: newSize },
                }));
              }}
              title="Reducir"
            >
              ➖
            </button>
            {/* Delete button */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-full text-xl mb-2 shadow"
              onClick={() => {
                if (typeof onDeleteItem === 'function' && actualSelectedId) {
                  onDeleteItem(actualSelectedId);
                  actualSetSelectedId(null); // Clear selection on delete
                }
              }}
              title="Borrar"
            >
              🗑️
            </button>
            {/* Move up button */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-1 shadow"
              onClick={() => {
                if (typeof onMoveItem === 'function' && actualSelectedId) {
                  onMoveItem(actualSelectedId, 'up');
                }
              }}
              title="Subir capa"
            >
              ⬆️
            </button>
            {/* Move down button */}
            <button
              className="w-9 h-9 flex items-center justify-center bg-gray-500 text-white rounded-full text-xl mb-2 shadow"
              onClick={() => {
                if (typeof onMoveItem === 'function' && actualSelectedId) {
                  onMoveItem(actualSelectedId, 'down');
                }
              }}
              title="Bajar capa"
            >
              ⬇️
            </button>
            {/* Lock/unlock button */}
            <button
              className={`w-9 h-9 flex items-center justify-center ${itemStates[actualSelectedId]?.locked ? 'bg-yellow-500' : 'bg-gray-300'} text-white rounded-full text-xl mb-2 shadow`}
              onClick={() => {
                const fabricCanvas = fabricRef.current;
                if (fabricCanvas) {
                  const obj = fabricCanvas.getObjects().find(o => (o as any).id === actualSelectedId);
                  if (obj) {
                    const locked = !itemStates[actualSelectedId]?.locked;
                    obj.set({
                      lockMovementX: locked,
                      lockMovementY: locked,
                      lockScalingX: locked,
                      lockScalingY: locked,
                      lockRotation: locked,
                      hasControls: !locked,
                      hoverCursor: locked ? 'default' : 'move',
                    });
                    fabricCanvas.renderAll();
                    setItemStates(states => ({
                      ...states,
                      [actualSelectedId]: { ...states[actualSelectedId], locked },
                    }));
                  }
                }
              }}
              title={itemStates[actualSelectedId]?.locked ? 'Unlock' : 'Lock'}
            >
              {itemStates[actualSelectedId]?.locked ? '🔓' : '🔒'}
            </button>
          </div>
        )}
        {/* Layer list and thumbnails */}
        <div className="flex flex-col gap-2 items-center">
          {items.length === 0 && <span className="text-xs text-gray-400">Sin capas</span>}
          {items.map(item => (
            <button
              key={item.id}
              className={`w-10 h-10 flex items-center justify-center rounded border ${actualSelectedId === item.id ? 'border-pink-500 bg-pink-100' : 'border-gray-300 bg-white'} transition`}
              onClick={() => {
                actualSetSelectedId(item.id);
                // Force selection in canvas even if not selectable
                const fabricCanvas = fabricRef.current;
                if (fabricCanvas) {
                  const obj = fabricCanvas.getObjects().find(o => (o as any).id === item.id);
                  if (obj) {
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.setActiveObject(obj);
                    fabricCanvas.renderAll();
                  }
                }
              }}
            >
              <img src={item.src} alt="icon" className="w-7 h-7 object-contain" />
            </button>
          )).reverse()}
        </div>
      </div>
    </div>
  );
};

export default CanvasArea; 