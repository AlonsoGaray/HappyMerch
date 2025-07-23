import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import NavBar from '../components/NavBar';
import { TABS } from '../constants';
import ProductSelector, { type Product } from '../components/ProductSelector';
import ElementSelector from '../components/ElementSelector';
import TextTools from '../components/TextTools';
import CanvasArea from '../components/CanvasArea';
import Tabs from '../components/Tabs';
import type { CanvasItem } from '../types';
import RightSidebar from '../components/RightSidebar';
import { Canvas } from 'fabric';
import BgSelector from '../components/BgSelector';
import BottomBar from '../components/BottomBar';
import LeftSidebar from '../components/LeftSideBar';
import { useGlobalData } from '../contexts/AdminDataContext';
import { saveDesignWithFeedback } from '../lib/supabase';

const DEFAULT_SIZE = 60;

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

const EditPage: React.FC = () => {
  const { data } = useGlobalData();
  const [productIdx, setProductIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('product');
  const [selectedBgIdx, setSelectedBgIdx] = useState(-1);
  const [canvasItems, setCanvasItems] = useState<CanvasAnyItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Cambia la definición de itemStates para incluir scaleX, scaleY y flipX
  const [itemStates, setItemStates] = useState<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean; visible: boolean; scaleX: number; scaleY: number; flipX: boolean } }>({});
  const fabricRef = useRef<Canvas | null>(null);
  const [scale, setScale] = useState(1);
  const [showDashedBorder, setShowDashedBorder] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  // Adapt to new product structure from data.products
  const visibleProducts: Product[] = data.products.filter((p: Product) => p.visible);
  const product = visibleProducts[productIdx] || visibleProducts[0];
  const visibleBackgrounds = data.backgrounds.filter((bg: any) => bg.visible);

  const handleAddElement = (element: { id: string; name: string; url: string; visible: boolean }) => {
    const newId = Date.now();
    // Centro puro del área de edición
    const centerX = product.width / 2;
    const centerY = product.height / 2;
    setCanvasItems(items => [
      ...items,
      {
        id: newId,
        src: element.url,
        x: centerX,
        y: centerY,
      },
    ]);
    setSelectedId(newId);
    // Inicializa el estado de escala para el nuevo elemento con tamaño pequeño y flipX en false
    setItemStates(states => ({
      ...states,
      [newId]: {
        x: centerX,
        y: centerY,
        size: DEFAULT_SIZE,
        rotation: 0,
        locked: false,
        visible: true,
        scaleX: 0.5,
        scaleY: 0.5,
        flipX: false,
      },
    }));
  };

  const handleDeleteItem = (id: number) => {
    setCanvasItems(items => items.filter(item => item.id !== id));
  };

  const handleMoveItem = (id: number, direction: 'up' | 'down') => {
    setCanvasItems(items => {
      const idx = items.findIndex(item => item.id === id);
      if (idx === -1) return items;
      const newItems = [...items];
      if (direction === 'up' && idx < items.length - 1) {
        [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
      } else if (direction === 'down' && idx > 0) {
        [newItems[idx], newItems[idx - 1]] = [newItems[idx - 1], newItems[idx]];
      }
      return newItems;
    });
  };

  // Handlers para Sidebar
  const handleRotate = (id: number, angleIncrement: number) => {
    setItemStates(states => {
      let newRotation: number;
      if (angleIncrement === -999) {
        // Caso especial para reset a 0°
        newRotation = 0;
      } else {
        const currentRotation = states[id]?.rotation ?? 0;
        newRotation = (currentRotation + angleIncrement) % 360;
      }
      return {
        ...states,
        [id]: { ...states[id], rotation: newRotation },
      };
    });
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        let newAngle: number;
        if (angleIncrement === -999) {
          // Caso especial para reset a 0°
          newAngle = 0;
        } else {
          const currentAngle = obj.angle ?? 0;
          newAngle = (currentAngle + angleIncrement) % 360;
        }
        obj.set('angle', newAngle);
        fabricCanvas.renderAll();
      }
    }
  };
  const handleFlipX = (id: number) => {
    setItemStates(states => {
      const prev = states[id]?.flipX ?? false;
      return {
        ...states,
        [id]: {
          ...states[id],
          flipX: !prev,
        },
      };
    });
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        obj.set('flipX', !(obj.flipX));
        fabricCanvas.renderAll();
      }
    }
  };
  const handleResize = (id: number, factor: number) => {
    setItemStates(states => {
      const curr = states[id]?.size ?? DEFAULT_SIZE;
      const newSize = factor > 1 ? curr * factor : Math.max(curr * factor, 10);
      return {
        ...states,
        [id]: { ...states[id], size: newSize },
      };
    });
  };
  const handleLockToggle = (id: number) => {
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        const locked = !itemStates[id]?.locked;
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
          [id]: { ...states[id], locked },
        }));
      }
    }
  };
  const isLocked = (id: number) => !!itemStates[id]?.locked;

  // Handler para agregar texto
  const handleAddText = (text: string, font: string, color: string) => {
    const newId = Date.now();
    // Centro puro del área de edición
    const centerX = product.width / 2;
    const centerY = product.height / 2;
    setCanvasItems(items => [
      ...items,
      {
        id: newId,
        type: 'text',
        text,
        font,
        color,
        x: centerX,
        y: centerY,
      },
    ]);
    setSelectedId(newId);
  };

  // Handler para actualizar fuente/color de un texto existente
  const handleUpdateTextItem = (id: number, changes: Partial<{ font: string; color: string }>) => {
    setCanvasItems(items => items.map(item => {
      if (item.id === id && (item as any).type === 'text') {
        return { ...item, ...changes };
      }
      return item;
    }));
    // Opcional: refrescar el canvas manualmente si no se actualiza solo
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj && changes.font) obj.set('fontFamily',
        changes.font === 'font-sans' ? 'sans-serif' :
        changes.font === 'font-serif' ? 'serif' :
        changes.font === 'font-mono' ? 'monospace' :
        changes.font === 'font-extrabold' ? 'inherit' : 'inherit');
      if (obj && changes.color) obj.set('fill', changes.color);
      fabricCanvas.renderAll();
    }
  };

  // Handler para alternar visibilidad
  const handleToggleVisible = (id: number) => {
    setItemStates(states => ({
      ...states,
      [id]: {
        ...states[id],
        visible: !states[id]?.visible,
      },
    }));
  };
  const isVisible = useCallback((id: number) => itemStates[id]?.visible !== false, [itemStates]);

  // Handler para reordenar capas desde DnD
  const handleReorderItems = (newOrder: CanvasAnyItem[]) => {
    setCanvasItems(newOrder);
  };

  // Handler para alinear el elemento en el canvas según la posición 3x3
  const handleAlign = (id: number, position: string) => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
    if (!obj) return;

    // Dimensiones del canvas de edición
    const canvasW = product.width;
    const canvasH = product.height;
    // Centro puro
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;
    // Bordes
    const left = 0;
    const top = 0;
    const right = canvasW;
    const bottom = canvasH;

    // Tamaño del objeto (asumimos centrado)
    const objW = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const objH = (obj.height ?? 0) * (obj.scaleY ?? 1);

    // Calcula la nueva posición
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

    // Actualiza el estado
    setItemStates(states => ({
      ...states,
      [id]: {
        ...states[id],
        x,
        y,
      },
    }));
    // Actualiza el objeto en Fabric.js
    obj.set({
      left: x * scale,
      top: y * scale,
    });
    fabricCanvas.renderAll();
  };

  const handleSave = async (feedbackData: {
    name: string;
    email: string;
    comment: string;
    rating: number;
  }) => {
    if (!fabricRef.current) return;

    try {
      const canvas = fabricRef.current;
      const dataUrl = canvas.toDataURL({
        multiplier: 2
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await saveDesignWithFeedback(blob, feedbackData);
      alert('¡Gracias por tu opinión! Tu diseño ha sido guardado.');
    } catch (error) {
      console.error('Error al guardar:', error);
      // Dump all image URLs currently in the canvas
      const fabricCanvas = fabricRef.current;
      if (fabricCanvas) {
        fabricCanvas.getObjects().forEach(obj => {
          if (obj.type === 'image' && 'getSrc' in obj) {
            console.log('Imagen en canvas:', (obj as any).getSrc());
          }
        });
      }
      alert('Hubo un error al guardar tu diseño. Por favor, intenta de nuevo.');
    }
  };

  // Lógica para permitir zoom infinito con pan
  const handleZoom = (factor: number) => {
    // El nuevo scale propuesto
    let newScale = scale * factor;
    // Solo limitar el zoom mínimo para que no desaparezca completamente
    const minScale = 0.1; // No menos de 0.1x
    if (newScale < minScale) newScale = minScale;
    setScale(newScale);
  };

  // Asegurarse de que cada item tenga un estado inicial, incluyendo visible y flipX
  useEffect(() => {
    setItemStates(prev => {
      const updated = { ...prev };
      let changed = false;
      canvasItems.forEach(item => {
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
          // Asegura que scaleX, scaleY y flipX existan en todos los items
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
      return changed ? updated : prev;
    });
  }, [canvasItems, setItemStates]);

  // Sincroniza flipX de itemStates con Fabric.js al cambiar de selección
  useEffect(() => {
    if (selectedId !== null && fabricRef.current) {
      const obj = fabricRef.current.getObjects().find(o => (o as any).id === selectedId);
      if (obj && itemStates[selectedId] && obj.flipX !== itemStates[selectedId].flipX) {
        obj.set('flipX', itemStates[selectedId].flipX);
        fabricRef.current.renderAll();
      }
    }
  }, [selectedId, itemStates, fabricRef]);

  const memoizedCanvasItems = useMemo(() => canvasItems, [canvasItems]);
  const memoizedItemStates = useMemo(() => itemStates, [itemStates]);
  const memoizedProduct = useMemo(() => product, [product]);

  return (
    <div className="min-h-dvh flex flex-col bg-gray-100 max-h-dvh items-center pb-5">
      <NavBar onSave={handleSave} />
      <div className="flex-grow flex relative w-full justify-center items-center overflow-hidden">
        <LeftSidebar 
          selectedId={selectedId}
          onRotate={handleRotate}
          onResize={handleResize}
          onAlign={handleAlign}
          onFlipX={handleFlipX}
        />
        <div className='flex flex-col w-full h-full justify-center items-center gap-5 overflow-auto'>
          <CanvasArea
            product={memoizedProduct}
            items={memoizedCanvasItems}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            fabricRef={fabricRef}
            itemStates={memoizedItemStates}
            setItemStates={setItemStates}
            scale={scale}
            selectedBg={selectedBgIdx >= 0 && selectedBgIdx < visibleBackgrounds.length ? visibleBackgrounds[selectedBgIdx] : null}
            onUpdateItems={setCanvasItems}
            showDashedBorder={showDashedBorder}
            isVisible={isVisible}
          />
          <BottomBar 
            selectedId={selectedId}
            onToggleDashedBorder={() => setShowDashedBorder(v => !v)}
            onToggleLayers={() => setShowLayers(v => !v)}
            onZoom={handleZoom}
          />
        </div>
        {showLayers && (
          <RightSidebar
            selectedId={selectedId}
            canvasItems={canvasItems}
            setSelectedId={setSelectedId}
            onDeleteItem={handleDeleteItem}
            onMoveItem={handleMoveItem}
            onLockToggle={handleLockToggle}
            isLocked={isLocked}
            onToggleVisible={handleToggleVisible}
            isVisible={isVisible}
            onReorderItems={handleReorderItems}
          />
        )}
      </div>
      <div className={`relative w-full pt-2 px-4 pb-2 flex flex-col max-w-11/12 overflow-visible rounded-xl scroll`} style={{ backgroundColor: data.config?.main_color }}>
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {activeTab === 'product' && (
          <ProductSelector onSelect={setProductIdx} />
        )}
        {activeTab === 'fondos' && (
          <BgSelector onSelect={setSelectedBgIdx} />
        )}
        {activeTab === 'elements' && (
          <ElementSelector onSelect={handleAddElement} />
        )}
        {activeTab === 'text' && <TextTools
          onAddText={handleAddText}
          selectedTextItem={canvasItems.find(i => i.id === selectedId && (i as any).type === 'text') as CanvasTextItem | undefined}
          onUpdateTextItem={handleUpdateTextItem}
        />}
      </div>
    </div>
  );
};

export default EditPage; 