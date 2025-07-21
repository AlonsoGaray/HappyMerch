import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Image, IText, Point } from 'fabric';
import type { CanvasItem } from '../types';
import type { Product } from './ProductSelector';

// Define también aquí el tipo CanvasTextItem y CanvasAnyItem
export type CanvasTextItem = {
  id: number;
  type: 'text';
  text: string;
  font: string;
  color: string;
  x: number;
  y: number;
};
export type CanvasAnyItem = CanvasItem | CanvasTextItem;

type CanvasAreaProps = {
  product: Product;
  items?: CanvasAnyItem[];
  selectedId?: number | null;
  setSelectedId?: (id: number | null) => void;
  fabricRef: React.MutableRefObject<Canvas | null>;
  itemStates: { [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean; visible: boolean; scaleX: number; scaleY: number } };
  setItemStates: React.Dispatch<React.SetStateAction<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean; visible: boolean; scaleX: number; scaleY: number } }>>;
  scale: number;
  selectedBg?: { name: string; url: string } | null;
  onUpdateItems?: (updatedItems: CanvasAnyItem[]) => void;
  showDashedBorder?: boolean;
  isVisible: (id: number) => boolean;
};


const DEFAULT_SIZE = 60;

// CanvasArea component renders the product image, a canvas for editing, and a sidebar for layer controls.
const CanvasArea: React.FC<CanvasAreaProps> = ({ 
  product, 
  items = [], 
  selectedId, 
  setSelectedId, 
  fabricRef, 
  itemStates, 
  setItemStates, 
  scale, 
  selectedBg, 
  onUpdateItems, 
  showDashedBorder, 
  isVisible 
}) => {
  if (!product) return <div>Cargando</div>
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
  // Pan state for dragging the view
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Pan drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });



  // Reset pan when product changes
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [product]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Solo activar pan si no se está haciendo clic en el canvas o sus elementos
    const target = e.target as HTMLElement;
    const canvasContainer = target.closest('[data-canvas-container]');
    if (!canvasContainer) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'CANVAS') {
        setIsDragging(true);
        setDragStart({ 
          x: e.touches[0].clientX - pan.x, 
          y: e.touches[0].clientY - pan.y 
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault(); // Prevent scrolling
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  /**
   * Initialize Fabric.js canvas when the component mounts or when canvas size changes.
   */
  useEffect(() => {
    if (!canvasElRef.current || !product) return; // <-- agrega !product aquí
    const fabricCanvas = new Canvas(canvasElRef.current, {
      width: product.width,
      height: product.height,
      selection: true,
      editable: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
    });
    fabricRef.current = fabricCanvas;
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
    fabricCanvas.renderAll();
    return () => {
      fabricCanvas.dispose();
    };
  }, [product, fabricRef]);

  /**
   * Sync items with Fabric.js canvas. Handles adding images, updating their properties, and selection events.
   */
  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
    fabricCanvas.renderAll();

    // Limpiar fondo anterior si existe
    const bgObj = fabricCanvas.getObjects().find(obj => (obj as any).id === 'background');
    if (bgObj) {
      fabricCanvas.remove(bgObj);
    }

    // Agregar fondo si hay uno seleccionado
    if (selectedBg) {
      Image.fromURL(selectedBg.url, {crossOrigin: 'anonymous'}).then((bgImg) => {
        // Escalado exacto al canvas
        const scaleX = product.width / (bgImg.width ?? 1);
        const scaleY = product.height / (bgImg.height ?? 1);
        bgImg.set({
          left: 0,
          top: 0,
          scaleX,
          scaleY,
          selectable: false,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          objectCaching: false,
          originX: 'left',
          originY: 'top',
        }), {crossOrigin: 'anonymous'};
        (bgImg as any).id = 'background';
        fabricCanvas.add(bgImg);
        // Alternativa para enviar al fondo sin error de linter
        const lastObj = fabricCanvas._objects.pop();
        if (lastObj) fabricCanvas._objects.unshift(lastObj);
        fabricCanvas.renderAll();
      });
    }

    // Agregar los elementos normales y textos
    items.filter(item => isVisible(item.id)).forEach(async item => {
      if ((item as any).type === 'text') {
        const textItem = item as any;
        // Determinar el nombre real de la fuente
        let fontFamily = textItem.font;
        if (fontFamily === 'font-pacifico') fontFamily = 'Pacifico';
        else if (fontFamily === 'font-anton') fontFamily = 'Anton';
        else if (fontFamily === 'font-lobster') fontFamily = 'Lobster';
        else if (fontFamily === 'font-oswald') fontFamily = 'Oswald';
        else if (fontFamily === 'font-shadow') fontFamily = 'Shadows Into Light';
        else if (fontFamily === 'font-playfair') fontFamily = 'Playfair Display';
        else if (fontFamily === 'font-montserrat') fontFamily = 'Montserrat';
        else if (fontFamily === 'font-verdana') fontFamily = 'Verdana';
        else if (fontFamily === 'font-courier') fontFamily = 'Courier';
        else if (fontFamily === 'font-georgia') fontFamily = 'Georgia';

        const txt = new IText(textItem.text, {
          left: itemStates[item.id]?.x ?? textItem.x,
          top: itemStates[item.id]?.y ?? textItem.y,
          fontFamily: fontFamily,
          fill: textItem.color,
          fontSize: itemStates[item.id]?.size ?? DEFAULT_SIZE,
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
          editable: true,
          cornerStyle: 'circle',
          cornerColor: '#fff',
          cornerStrokeColor: '#fff',
          // Nuevo: aplicar scaleX y scaleY si existen
          scaleX: itemStates[item.id]?.scaleX ?? 1,
          scaleY: itemStates[item.id]?.scaleY ?? 1,
        });
        (txt as any).id = item.id;
        fabricCanvas.add(txt);
        if (actualSelectedId === item.id) {
          fabricCanvas.setActiveObject(txt);
        }
        // Configurar eventos de edición
        txt.on('mousedblclick', () => {
          (txt as any).enterEditing();
          (txt as any).selectAll();
        });
        // Actualizar estado cuando se modifica la posición/tamaño
        txt.on('modified', () => {
          const newFontSize = txt.fontSize ?? DEFAULT_SIZE;
          const newScaleX = txt.scaleX ?? 1;
          const newScaleY = txt.scaleY ?? 1;
          setItemStates(states => ({
            ...states,
            [item.id]: {
              x: txt.left ?? 0,
              y: txt.top ?? 0,
              size: newFontSize,
              rotation: txt.angle ?? 0,
              locked: itemStates[item.id]?.locked ?? false,
              visible: itemStates[item.id]?.visible ?? true,
              scaleX: newScaleX,
              scaleY: newScaleY,
            },
          }));
          if (onUpdateItems) {
            onUpdateItems(items.map(it =>
              it.id === item.id ? { ...it, size: newFontSize } : it
            ));
          }
        });
        (txt as any).on('editing:exited', () => {
          const updatedItems = items.map(item => {
            if (item.id === textItem.id) {
              return { ...item, text: txt.text || '' };
            }
            return item;
          });
          if (onUpdateItems) {
            onUpdateItems(updatedItems);
          }
        });
      } else {
        const img = await Image.fromURL((item as any).src, {crossOrigin: 'anonymous'});
        img.set({
          left: itemStates[item.id]?.x ?? (item as any).x,
          top: itemStates[item.id]?.y ?? (item as any).y,
          scaleX: ((itemStates[item.id]?.size ?? DEFAULT_SIZE) / (img.width ?? DEFAULT_SIZE)),
          scaleY: ((itemStates[item.id]?.size ?? DEFAULT_SIZE) / (img.height ?? DEFAULT_SIZE)),
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
        }), {crossOrigin: 'anonymous'};
        img.setControlsVisibility({
          mt: false,
          mb: false,
          ml: false,
          mr: false,
          tl: true,
          tr: true,
          bl: true,
          br: true,
        });
        (img as any).id = item.id;
        fabricCanvas.add(img);
        if (actualSelectedId === item.id) {
          fabricCanvas.setActiveObject(img);
        }
        img.on('modified', () => {
          setItemStates(states => ({
            ...states,
            [item.id]: {
              x: img.left ?? 0,
              y: img.top ?? 0,
              size: ((img.scaleX ?? 1) * (img.width ?? DEFAULT_SIZE)),
              rotation: img.angle ?? 0,
              locked: itemStates[item.id]?.locked ?? false,
              visible: itemStates[item.id]?.visible ?? true,
              scaleX: img.scaleX ?? 1,
              scaleY: img.scaleY ?? 1,
            },
          }));
        });
      }
    });
    // APLICAR ZOOM NATIVO DE FABRIC
    fabricCanvas.setZoom(1); // Mantener zoom 1ya que el contenedor se escala
    // Centrar el viewport después de hacer zoom
    const center = {
      x: (fabricCanvas.getWidth() / 2) - (fabricCanvas.getWidth() / 2),
      y: (fabricCanvas.getHeight() / 2) - (fabricCanvas.getHeight() / 2),
    };
    fabricCanvas.absolutePan(new Point(-center.x, -center.y));
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
    
    // Listener global para doble clic en texto
    const handleDoubleClick = (e: any) => {
      console.log('Doble clic global detectado:', e.target);
      if (e.target && e.target.type === 'text') {
        console.log('Activando edición de texto');
        (e.target as any).enterEditing();
        (e.target as any).selectAll();
      }
    };
    fabricCanvas.on('mouse:dblclick', handleDoubleClick);
    
    // Cleanup listeners on unmount
    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleCleared);
      fabricCanvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [items, itemStates, scale, actualSelectedId, fabricRef, setItemStates, actualSetSelectedId, selectedBg, isVisible]);

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
            visible: true,
            scaleX: 1,
            scaleY: 1,
          };
          changed = true;
        } else {
          // Asegura que scaleX y scaleY existan en todos los items
          if (updated[item.id].scaleX === undefined) {
            updated[item.id].scaleX = 1;
            changed = true;
          }
          if (updated[item.id].scaleY === undefined) {
            updated[item.id].scaleY = 1;
            changed = true;
          }
        }
      });
      return changed ? updated : prev;
    });
  }, [items, setItemStates]);

  return (
      <div
        ref={containerRef}
        className="relative flex max-w-md w-full h-[460px] max-h-[460px] bg-white overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Contenedor que agrupa imagen y canvas y aplica la transformación */}
        <div
          style={{
            width: 400,
            height: 400,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translateX(${pan.x}px) translateY(${pan.y}px) scale(${scale})`, // <--- volver a agregar scale aquí
            transformOrigin: 'top left',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {/* Imagen centrada, sin transform individual */}
          <img
            src={product.url}
            alt={product.name}
            className="absolute left-0 top-0 object-contain pointer-events-none select-none"
            draggable={false}
            style={{
              width: 400,
              height: 400,
              display: 'block',
              zIndex: 1,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
            ref={imgRef}
          />
          {/* Canvas overlay centrado, sin transform individual */}
          <div
            data-canvas-container
            style={{
              width: product.width,
              height: product.height,
              position: 'absolute',
              left: product.left,
              top: product.top,
              zIndex: 2,
              pointerEvents: 'auto',
            }}
          >
            {/* Borde siempre presente, solo cambia visibilidad */}
            <div
              className={`absolute left-0 top-0 w-full h-full border-2 border-dashed border-red-500 rounded z-10 ${showDashedBorder ? '' : 'invisible'}`}
              key="border"
              style={{ pointerEvents: 'none' }}
            />
            <canvas
              ref={canvasElRef}
              width={product.width}
              height={product.height}
              className="absolute left-0 top-0"
              style={{ zIndex: 2, background: 'transparent', pointerEvents: 'auto', width: '100%', height: '100%' }}
              key="canvas"
            />
          </div>
        </div>
      </div>
  );
};

export default CanvasArea; 