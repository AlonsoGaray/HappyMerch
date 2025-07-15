import React, { useState, useRef, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { PRODUCTS, ELEMENTS, TABS, FONDOS } from '../constants';
import ProductSelector from '../components/ProductSelector';
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

const DEFAULT_SIZE = 60;

// Extiende CanvasItem para soportar textos
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
  const [productIdx, setProductIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('product');
  const [selectedBgIdx, setSelectedBgIdx] = useState(-1);
  const [canvasItems, setCanvasItems] = useState<CanvasAnyItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean; visible: boolean } }>({});
  const fabricRef = useRef<Canvas | null>(null);
  const [scale, setScale] = useState(1);
  const [showDashedBorder, setShowDashedBorder] = useState(true);

  const product = PRODUCTS[productIdx];

  const handleAddElement = (element: { name: string; image: string }) => {
    const newId = Date.now();
    // Centro puro del área de edición
    const centerX = product.canvas.width / 2;
    const centerY = product.canvas.height / 2;
    setCanvasItems(items => [
      ...items,
      {
        id: newId,
        src: element.image,
        x: centerX,
        y: centerY,
      },
    ]);
    setSelectedId(newId);
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
  const handleCenter = (id: number) => {
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        // Centro puro del área de edición (canvas)
        const centerX = product.canvas.width / 2;
        const centerY = product.canvas.height / 2;

        // Actualizar el estado: x/y es el centro puro
        setItemStates(states => ({
          ...states,
          [id]: {
            ...states[id],
            x: centerX,
            y: centerY,
          },
        }));

        // Actualizar el objeto de Fabric.js
        obj.set({
          left: centerX * scale,
          top: centerY * scale,
        });
        fabricCanvas.renderAll();
      }
    }
  };
  const handleFlipX = (id: number) => {
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find(o => (o as any).id === id);
      if (obj) {
        obj.set('flipX', !obj.flipX);
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
    const centerX = product.canvas.width / 2;
    const centerY = product.canvas.height / 2;
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
  const isVisible = (id: number) => itemStates[id]?.visible !== false;

  // Handler para reordenar capas desde DnD
  const handleReorderItems = (newOrder: CanvasAnyItem[]) => {
    setCanvasItems(newOrder);
  };

  // Asegurarse de que cada item tenga un estado inicial, incluyendo visible
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
          };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [canvasItems, setItemStates]);

  return (
    <div className="min-h-screen items-center bg-gray-100 flex flex-col justify-between max-h-screen">
      <NavBar />
      <div className="relative flex w-full h-full justify-center">
        <LeftSidebar 
          selectedId={selectedId}
          onFlipX={handleFlipX}
        />
        <div className='flex flex-col w-full h-full justify-center items-center gap-5'>
          <CanvasArea
            product={product}
            items={canvasItems}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            fabricRef={fabricRef}
            itemStates={itemStates}
            setItemStates={setItemStates}
            scale={scale}
            setScale={setScale}
            selectedBg={selectedBgIdx >= 0 && selectedBgIdx < FONDOS.length ? FONDOS[selectedBgIdx] : null}
            onUpdateItems={setCanvasItems}
            showDashedBorder={showDashedBorder}
            isVisible={isVisible}
          />
          <BottomBar 
            selectedId={selectedId}
            onResize={handleResize}
            onToggleDashedBorder={() => setShowDashedBorder(v => !v)}
          />
        </div>
        <RightSidebar
          selectedId={selectedId}
          canvasItems={canvasItems}
          setSelectedId={setSelectedId}
          onDeleteItem={handleDeleteItem}
          onMoveItem={handleMoveItem}
          onRotate={handleRotate}
          onFlipX={handleFlipX}
          onCenter={handleCenter}
          onLockToggle={handleLockToggle}
          isLocked={isLocked}
          onToggleVisible={handleToggleVisible}
          isVisible={isVisible}
          onReorderItems={handleReorderItems}
        />
      </div>
      <div className="w-full bg-pink-500 pt-6 px-2 pb-2 flex flex-col items-center sticky bottom-0 z-10">
        <div className="relative w-full flex justify-center">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        {activeTab === 'product' && (
          <ProductSelector products={PRODUCTS} selectedIdx={productIdx} onSelect={setProductIdx} />
        )}
        {activeTab === 'fondos' && (
          <BgSelector fondos={FONDOS} selectedIdx={selectedBgIdx} onSelect={setSelectedBgIdx} />
        )}
        {activeTab === 'elements' && (
          <ElementSelector elements={ELEMENTS} onSelect={handleAddElement} />
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