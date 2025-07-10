import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Image } from 'fabric';
import type { CanvasItem } from '../types';

type CanvasAreaProps = {
  product: {
    name: string;
    image: string;
    canvas: { width: number; height: number; top: number };
    imageWidth: number;
    imageHeight: number;
  };
  items?: CanvasItem[];
  selectedId?: number | null;
  setSelectedId?: (id: number | null) => void;
  fabricRef: React.MutableRefObject<Canvas | null>;
  itemStates: { [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean } };
  setItemStates: React.Dispatch<React.SetStateAction<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean } }>>;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
};

const DEFAULT_SIZE = 60;

// CanvasArea component renders the product image, a canvas for editing, and a sidebar for layer controls.
const CanvasArea: React.FC<CanvasAreaProps> = ({ product, items = [], selectedId, setSelectedId, fabricRef, itemStates, setItemStates, scale, setScale }) => {
  const isControlled = typeof selectedId !== 'undefined' && typeof setSelectedId === 'function';
  const [internalSelectedId, internalSetSelectedId] = useState<number | null>(null);
  const actualSelectedId = isControlled ? selectedId : internalSelectedId;
  const actualSetSelectedId = isControlled ? setSelectedId! : internalSetSelectedId;
  // Canvas DOM element reference
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // Product image reference
  const imgRef = useRef<HTMLImageElement>(null);
  // Container div reference
  const containerRef = useRef<HTMLDivElement>(null);
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
  }, [product, setScale]);

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
  }, [product.canvas.width, product.canvas.height, scale, fabricRef]);

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
  }, [items, itemStates, scale, actualSelectedId, fabricRef, setItemStates, actualSetSelectedId]);

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
  }, [items, setItemStates]);

  return (
      <div
        ref={containerRef}
        className="relative flex max-w-md w-full h-[460px] max-h-[460px] bg-white"
      >
        {/* Imagen centrada */}
        <img
          src={product.image}
          alt={product.name}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain pointer-events-none select-none"
          draggable={false}
          style={{
            width: containerDims.width,
            height: containerDims.height,
            display: 'block',
            zIndex: 1,
          }}
          ref={imgRef}
        />
        {/* Canvas overlay centrado */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            top: product.canvas.top * scale,
            width: product.canvas.width * scale,
            height: product.canvas.height * scale,
            zIndex: 2,
            pointerEvents: 'none',
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
  );
};

export default CanvasArea; 