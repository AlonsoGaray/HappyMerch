// CanvasArea.tsx
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas, Image, IText, Point } from 'fabric';
import type { CanvasItem } from '../types';
import type { Product } from './ProductSelector';

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

export type ItemStates = {
  [id: number]: {
    x: number;
    y: number;
    size: number;
    rotation: number;
    locked: boolean;
    visible: boolean;
    scaleX: number;
    scaleY: number;
    flipX: boolean;
  };
};

export type CanvasAreaHandle = {
  rotateItem: (id: number, angle: number) => void;
  resizeItem: (id: number, factor: number) => void;
  alignItem: (id: number, position: string, product: Product) => void;
  flipItem: (id: number) => void;
  lockItem: (id: number) => void;
};

type CanvasAreaProps = {
  product: Product;
  items?: CanvasAnyItem[];
  selectedId?: number | null;
  setSelectedId?: (id: number | null) => void;
  fabricRef: React.MutableRefObject<Canvas | null>;
  scale: number;
  selectedBg?: { name: string; url: string } | null;
  onUpdateItems?: (updatedItems: CanvasAnyItem[]) => void;
  showDashedBorder?: boolean;
  isVisible: (id: number) => boolean;
  setItemStates?: React.Dispatch<React.SetStateAction<ItemStates>>;
  /** NEW: canonical item states from parent (Edit) */
  itemStates?: ItemStates;
  /** NEW: called BEFORE user-initiated changes to push history */
  onWillChange?: () => void;
  readOnly?: boolean;
};

const DEFAULT_SIZE = 60;

const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(({ 
  product, 
  items = [], 
  selectedId, 
  setSelectedId, 
  fabricRef, 
  scale, 
  selectedBg, 
  onUpdateItems, 
  showDashedBorder, 
  isVisible, 
  setItemStates, 
  itemStates,             // NEW
  onWillChange,           // NEW
  readOnly = false
}, ref) => {
  if (!product) return <div>Cargando</div>
  const actualSelectedId = selectedId;
  const actualSetSelectedId = setSelectedId;
  
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const itemStatesRef = useRef<ItemStates>({});
  const isSelectionFromCanvas = useRef(false);
  const pushedForTransformRef = useRef(false);

  // Keep internal states in sync with parent
  useEffect(() => {
    if (itemStates) {
      // shallow copy to avoid accidental mutation of parent state
      itemStatesRef.current = { ...itemStates };
    }
  }, [itemStates]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [product]);

  const handleMouseDown = (e: React.MouseEvent) => {
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
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!canvasElRef.current || !product) return;
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

    // Push history at the beginning of any transform gesture
    const handleBeforeTransform = () => {
      if (!readOnly && !pushedForTransformRef.current) {
        onWillChange?.();
        pushedForTransformRef.current = true;
      }
    };
    const handleTransformEndish = () => {
      pushedForTransformRef.current = false;
    };
    fabricCanvas.on('before:transform', handleBeforeTransform);
    fabricCanvas.on('object:modified', handleTransformEndish);
    fabricCanvas.on('selection:cleared', handleTransformEndish);
    fabricCanvas.on('mouse:up', handleTransformEndish);

    return () => {
      fabricCanvas.off('before:transform', handleBeforeTransform);
      fabricCanvas.off('object:modified', handleTransformEndish);
      fabricCanvas.off('selection:cleared', handleTransformEndish);
      fabricCanvas.off('mouse:up', handleTransformEndish);
      fabricCanvas.dispose();
    };
  }, [product, fabricRef, onWillChange, readOnly]);

  useEffect(() => {
    (async () => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
      fabricCanvas.renderAll();

      const bgObj = fabricCanvas.getObjects().find(obj => (obj as any).id === 'background');
      if (bgObj) {
        fabricCanvas.remove(bgObj);
      }
      if (selectedBg) {
        await Image.fromURL(selectedBg.url, {crossOrigin: 'anonymous'}).then((bgImg) => {
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
          const lastObj = fabricCanvas._objects.pop();
          if (lastObj) fabricCanvas._objects.unshift(lastObj);
          fabricCanvas.renderAll();
        });
      }

      const visibleItems = items.filter(item => isVisible(item.id));
      for (const item of visibleItems) {
        const itemState = itemStatesRef.current[item.id] || {};
        if ((item as any).type === 'text') {
          const textItem = item as any;
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
          else if (fontFamily === 'font-genty') fontFamily = 'Genty';
          else if (fontFamily === 'font-great-vibes') fontFamily = 'Great Vibes';
          else if (fontFamily === 'font-fredoka') fontFamily = 'Fredoka';
          else if (fontFamily === 'font-league-spartan') fontFamily = 'League Spartan';
          else if (fontFamily === 'font-bebas-neue') fontFamily = 'Bebas Neue';
          else if (fontFamily === 'font-baloo-2') fontFamily = 'Baloo 2';
          else if (fontFamily === 'font-chewy') fontFamily = 'Chewy';
          else if (fontFamily === 'font-bubblegum-sans') fontFamily = 'Bubblegum Sans';
          else if (fontFamily === 'font-luckiest-guy') fontFamily = 'Luckiest Guy';
          else if (fontFamily === 'font-comic-neue') fontFamily = 'Comic Neue';
          else if (fontFamily === 'font-gloria-hallelujah') fontFamily = 'Gloria Hallelujah';
          else if (fontFamily === 'font-bungee') fontFamily = 'Bungee';
          else if (fontFamily === 'font-spicy-rice') fontFamily = 'Spicy Rice';
          else if (fontFamily === 'font-henny-penny') fontFamily = 'Henny Penny';
          else if (fontFamily === 'font-apricotsy') fontFamily = 'Apricotsy';
          else if (fontFamily === 'font-brittany-signature') fontFamily = 'Brittany Signature';
          else if (fontFamily === 'font-clementine-sketch') fontFamily = 'Clementine Sketch';
          else if (fontFamily === 'font-hello-honey') fontFamily = 'Hello Honey';
          else if (fontFamily === 'font-junglefe') fontFamily = 'Junglefe';
          else if (fontFamily === 'font-lovelo') fontFamily = 'Lovelo';
          else if (fontFamily === 'font-magilio') fontFamily = 'Magilio';
          else if (fontFamily === 'font-neon-tubes') fontFamily = 'Neon Tubes';
          else if (fontFamily === 'font-playlist-script') fontFamily = 'Playlist Script';
          else if (fontFamily === 'font-selima') fontFamily = 'Selima';
          else if (fontFamily === 'font-sunset-club') fontFamily = 'Sunset Club';
          else if (fontFamily === 'font-wedges') fontFamily = 'Wedges';

          const txt = new IText(textItem.text, {
            left: itemState.x ?? textItem.x,
            top: itemState.y ?? textItem.y,
            fontFamily: fontFamily,
            fill: textItem.color,
            fontSize: itemState.size ?? DEFAULT_SIZE,
            angle: itemState.rotation ?? 0,
            selectable: readOnly ? false : !(itemState.locked),
            hasControls: readOnly ? false : !(itemState.locked),
            lockMovementX: readOnly ? true : !!itemState.locked,
            lockMovementY: readOnly ? true : !!itemState.locked,
            lockScalingX: readOnly ? true : !!itemState.locked,
            lockScalingY: readOnly ? true : !!itemState.locked,
            lockRotation: readOnly ? true : !!itemState.locked,
            hasBorders: true,
            objectCaching: false,
            originX: 'center',
            originY: 'center',
            editable: readOnly ? false : true,
            cornerStyle: 'circle',
            cornerColor: '#fff',
            cornerStrokeColor: '#fff',
            scaleX: itemState.scaleX ?? 1,
            scaleY: itemState.scaleY ?? 1,
            flipX: itemState.flipX ?? false,
          });
          (txt as any).id = item.id;
          fabricCanvas.add(txt);
          if (!readOnly && actualSelectedId === item.id) {
            fabricCanvas.setActiveObject(txt);
          }
          if (!readOnly) {
            // *** push history when text editing begins
            (txt as any).on('editing:entered', () => {
              onWillChange?.();
            });

            txt.on('modified', () => {
              const newFontSize = txt.fontSize ?? DEFAULT_SIZE;
              const newScaleX = txt.scaleX ?? 1;
              const newScaleY = txt.scaleY ?? 1;
              const payload = {
                x: txt.left ?? 0,
                y: txt.top ?? 0,
                size: newFontSize,
                rotation: txt.angle ?? 0,
                locked: itemState.locked ?? false,
                visible: itemState.visible ?? true,
                scaleX: newScaleX,
                scaleY: newScaleY,
                flipX: itemState.flipX ?? false,
              };
              itemStatesRef.current = {
                ...itemStatesRef.current,
                [item.id]: payload,
              };
              if (typeof setItemStates === 'function') {
                setItemStates((s) => ({ ...s, [item.id]: payload }));
              }
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
          }
        } else {
          const img = await Image.fromURL((item as any).src, {crossOrigin: 'anonymous'});
          const baseSize = img.width ?? DEFAULT_SIZE;
          const scale = (itemState.size ?? DEFAULT_SIZE) / baseSize;
          img.set({
            left: itemState.x ?? (item as any).x,
            top: itemState.y ?? (item as any).y,
            scaleX: scale,
            scaleY: scale,
            angle: itemState.rotation ?? 0,
            selectable: readOnly ? false : !(itemState.locked),
            hasControls: readOnly ? false : !(itemState.locked),
            lockMovementX: readOnly ? true : !!itemState.locked,
            lockMovementY: readOnly ? true : !!itemState.locked,
            lockScalingX: readOnly ? true : !!itemState.locked,
            lockScalingY: readOnly ? true : !!itemState.locked,
            lockRotation: readOnly ? true : !!itemState.locked,
            hasBorders: true,
            objectCaching: false,
            originX: 'center',
            originY: 'center',
            cornerStyle: 'circle',
            cornerColor: '#fff',
            cornerStrokeColor: '#fff',
            flipX: itemState.flipX ?? false,
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
          if (!readOnly && actualSelectedId === item.id) {
            fabricCanvas.setActiveObject(img);
          }
          if (!readOnly) {
            img.on('modified', () => {
              const payload = {
                x: img.left ?? 0,
                y: img.top ?? 0,
                size: ((img.scaleX ?? 1) * (img.width ?? DEFAULT_SIZE)),
                rotation: img.angle ?? 0,
                locked: itemState.locked ?? false,
                visible: itemState.visible ?? true,
                scaleX: img.scaleX ?? 1,
                scaleY: img.scaleY ?? 1,
                flipX: img.flipX ?? false,
              };
              itemStatesRef.current = {
                ...itemStatesRef.current,
                [item.id]: payload,
              };
              if (typeof setItemStates === 'function') {
                setItemStates((s) => ({ ...s, [item.id]: payload }));
              }
            });
          }
        }
      }
      if (!readOnly && actualSelectedId != null) {
        const obj = fabricCanvas.getObjects().find(o => (o as any).id === actualSelectedId);
        if (obj) {
          fabricCanvas.setActiveObject(obj);
          const flipXState = itemStatesRef.current[actualSelectedId]?.flipX;
          if (typeof flipXState === 'boolean' && obj.flipX !== flipXState) {
            obj.set('flipX', flipXState);
          }
        } else {
          fabricCanvas.discardActiveObject();
        }
      }
      fabricCanvas.setZoom(1);
      const center = {
        x: (fabricCanvas.getWidth() / 2) - (fabricCanvas.getWidth() / 2),
        y: (fabricCanvas.getHeight() / 2) - (fabricCanvas.getHeight() / 2),
      };
      fabricCanvas.absolutePan(new Point(-center.x, -center.y));
      fabricCanvas.renderAll();
    })();
  // also recompose when itemStates change so undo/redo updates canvas
  }, [items, selectedBg, product, scale, isVisible, fabricRef, readOnly, itemStates]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    if (readOnly) {
      fabricCanvas.discardActiveObject();
      fabricCanvas.selection = false;
      fabricCanvas.skipTargetFind = true;
      fabricCanvas.renderAll();
      return;
    } else {
      fabricCanvas.selection = true;
      fabricCanvas.skipTargetFind = false;
    }
    if (!isSelectionFromCanvas.current) {
      if (actualSelectedId != null) {
        const obj = fabricCanvas.getObjects().find(o => (o as any).id === actualSelectedId);
        if (obj) {
          fabricCanvas.setActiveObject(obj);
          const flipXState = itemStatesRef.current[actualSelectedId]?.flipX;
          if (typeof flipXState === 'boolean' && obj.flipX !== flipXState) {
            obj.set('flipX', flipXState);
          }
        } else {
          fabricCanvas.discardActiveObject();
        }
      } else {
        fabricCanvas.discardActiveObject();
      }
      fabricCanvas.renderAll();
    }
    isSelectionFromCanvas.current = false;
  }, [actualSelectedId, fabricRef, itemStatesRef.current, readOnly]);
  
  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    const handleSelection = (e: any) => {
      const obj = e.selected?.[0] || e.target;
      if (obj && typeof (obj as any).id === 'number' && actualSetSelectedId) {
        isSelectionFromCanvas.current = true;
        actualSetSelectedId((obj as any).id);
        const flipXState = itemStatesRef.current[(obj as any).id]?.flipX;
        if (typeof flipXState === 'boolean' && obj.flipX !== flipXState) {
          obj.set('flipX', flipXState);
          fabricCanvas.renderAll();
        }
      }
    };
    const handleCleared = () => {
      if (actualSetSelectedId) actualSetSelectedId(null);
    };
    const handleDoubleClick = (e: any) => {
      if (e.target && e.target.type === 'text') {
        (e.target as any).enterEditing();
        (e.target as any).selectAll();
      }
    };
    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', handleCleared);
    fabricCanvas.on('mouse:dblclick', handleDoubleClick);
    return () => {
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleCleared);
      fabricCanvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [fabricRef, actualSetSelectedId, itemStatesRef.current]);

  useEffect(() => {
    const updated = { ...itemStatesRef.current };
    let changed = false;
    items.forEach(item => {
      if (!updated[item.id]) {
        updated[item.id] = {
          x: (item as any).x,
          y: (item as any).y,
          size: DEFAULT_SIZE,
          rotation: 0,
          locked: false,
          visible: true,
          scaleX: 1,
          scaleY: 1,
          flipX: false,
        };
        changed = true;
      } else {
        if (updated[item.id].scaleX === undefined) {
          updated[item.id].scaleX = 1;
          changed = true;
        }
        if (updated[item.id].scaleY === undefined) {
          updated[item.id].scaleY = 1;
          changed = true;
        }
        if (updated[item.id].flipX === undefined) {
          updated[item.id].flipX = false;
          changed = true;
        }
      }
    });
    if (changed) itemStatesRef.current = updated;
  }, [items]);

  useImperativeHandle(ref, () => ({
    rotateItem: (id: number, angle: number) => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        let newAngle: number;
        if (angle === -999) {
          newAngle = 0;
        } else {
          const currentAngle = obj.angle ?? 0;
          newAngle = (currentAngle + angle) % 360;
        }
        obj.set('angle', newAngle);
        itemStatesRef.current[id] = {
          ...itemStatesRef.current[id],
          rotation: newAngle,
        };
        if (typeof setItemStates === 'function') {
          setItemStates((s) => ({ ...s, [id]: { ...s[id], rotation: newAngle } }));
        }
        fabricCanvas.renderAll();
      }
    },
    resizeItem: (id: number, factor: number) => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        const curr = itemStatesRef.current[id]?.size ?? DEFAULT_SIZE;
        const newSize = factor > 1 ? curr * factor : Math.max(curr * factor, 10);
        const scaleX = (obj.width ? newSize / obj.width : 1);
        const scaleY = (obj.height ? newSize / obj.height : 1);
        obj.set({ scaleX, scaleY });
        itemStatesRef.current[id] = {
          ...itemStatesRef.current[id],
          size: newSize,
          scaleX,
          scaleY,
        };
        if (typeof setItemStates === 'function') {
          setItemStates((s) => ({ ...s, [id]: { ...s[id], size: newSize, scaleX, scaleY } }));
        }
        fabricCanvas.renderAll();
      }
    },
    alignItem: (id: number, position: string, product: Product) => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (!obj) return;
      const canvasW = product.width;
      const canvasH = product.height;
      const centerX = canvasW / 2;
      const centerY = canvasH / 2;
      const left = 0;
      const top = 0;
      const right = canvasW;
      const bottom = canvasH;
      const objW = (obj.width ?? 0) * (obj.scaleX ?? 1);
      const objH = (obj.height ?? 0) * (obj.scaleY ?? 1);
      let x = centerX;
      let y = centerY;
      if (position.includes('left')) x = left + objW / 2;
      if (position.includes('right')) x = right - objW / 2;
      if (position === 'left') x = left + objW / 2;
      if (position === 'right') x = right - objW / 2;
      if (position === 'top-left' || position === 'top' || position === 'top-right') y = top + objH / 2;
      if (position === 'bottom-left' || position === 'bottom' || position === 'bottom-right') y = bottom - objH / 2;
      if (position === 'top') x = centerX;
      if (position === 'bottom') x = centerX;
      if (position === 'left') y = centerY;
      if (position === 'right') y = centerY;
      if (position === 'center') { x = centerX; y = centerY; }
      obj.set({ left: x, top: y });
      itemStatesRef.current[id] = {
        ...itemStatesRef.current[id],
        x,
        y,
      };
      if (typeof setItemStates === 'function') {
        setItemStates((s) => ({ ...s, [id]: { ...s[id], x, y } }));
      }
      fabricCanvas.renderAll();
    },
    flipItem: (id: number) => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        const prev = itemStatesRef.current[id]?.flipX ?? false;
        obj.set('flipX', !prev);
        itemStatesRef.current[id] = {
          ...itemStatesRef.current[id],
          flipX: !prev,
        };
        if (typeof setItemStates === 'function') {
          setItemStates((states) => ({
            ...states,
            [id]: {
              ...states[id],
              flipX: !prev,
            },
          }));
        }
        fabricCanvas.renderAll();
      }
    },
    lockItem: (id: number) => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        const prev = itemStatesRef.current[id]?.locked ?? false;
        obj.set('locked', !prev);
        itemStatesRef.current[id].locked = !prev;
        if (typeof setItemStates === 'function') {
          setItemStates((states) => ({
            ...states,
            [id]: {
              ...states[id],
              locked: !prev,
            },
          }));
        }
        fabricCanvas.renderAll();
      }
    },
  }), [fabricRef, product, setItemStates]);

  return (
      <div
        ref={containerRef}
        className="relative flex max-w-2xl w-full h-[650px] max-h-[650px] overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: readOnly ? 'none' : 'auto'}}
      >
        <div
          style={{
            width: 600,
            height: 600,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translateX(${pan.x}px) translateY(${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <img
            src={product.url}
            alt={product.name}
            className="absolute left-0 top-0 object-contain pointer-events-none select-none"
            draggable={false}
            style={{
              width: 600,
              height: 600,
              display: 'block',
              zIndex: 1,
              position: 'absolute',
            }}
            ref={imgRef}
          />
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
});

export default React.memo(CanvasArea);
