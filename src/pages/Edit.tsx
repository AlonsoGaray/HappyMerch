import React, { useState, useRef } from 'react';
import NavBar from '../components/NavBar';
import { PRODUCTS, ELEMENTS, TABS, FONDOS } from '../constants';
import ProductSelector from '../components/ProductSelector';
import ElementSelector from '../components/ElementSelector';
import TextTools from '../components/TextTools';
import CanvasArea from '../components/CanvasArea';
import Tabs from '../components/Tabs';
import type { CanvasItem } from '../types';
import Sidebar from '../components/Sidebar';
import { Canvas } from 'fabric';
import BgSelector from '../components/BgSelector';

const DEFAULT_SIZE = 60;

const EditPage: React.FC = () => {
  const [productIdx, setProductIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('product');
  const [selectedBgIdx, setSelectedBgIdx] = useState(-1);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<{ [id: number]: { x: number; y: number; size: number; rotation: number; locked: boolean } }>({});
  const fabricRef = useRef<Canvas | null>(null);
  const [scale, setScale] = useState(1);

  const product = PRODUCTS[productIdx];

  const handleAddElement = (element: { name: string; image: string }) => {
    const newId = Date.now();
    setCanvasItems(items => [
      ...items,
      {
        id: newId,
        src: element.image,
        x: 0,
        y: 0,
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

  return (
    <>
      <div className="min-h-screen items-center bg-gray-100 flex flex-col justify-between">
        <NavBar />
        <div className="relative flex w-full h-full justify-center">
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
          />
          <Sidebar
            selectedId={selectedId}
            canvasItems={canvasItems}
            setSelectedId={setSelectedId}
            onDeleteItem={handleDeleteItem}
            onMoveItem={handleMoveItem}
            onRotate={handleRotate}
            onFlipX={handleFlipX}
            onCenter={handleCenter}
            onResize={handleResize}
            onLockToggle={handleLockToggle}
            isLocked={isLocked}
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
          {activeTab === 'text' && <TextTools />}
        </div>
      </div>
    </>
  );
};

export default EditPage; 