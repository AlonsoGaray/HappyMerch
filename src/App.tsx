import React, { useRef, useState } from 'react';
import type { CanvasItem } from './types';
import NavBar from './components/NavBar';
import { PRODUCTS, ELEMENTS, TABS } from './constants';
import ProductSelector from './components/ProductSelector';
import ElementSelector from './components/ElementSelector';
import TextTools from './components/TextTools';
import CanvasArea from './components/CanvasArea';
import ActionButtons from './components/ActionButtons';
import Tabs from './components/Tabs';

const App: React.FC = () => {
  const [productIdx, setProductIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('product');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

  const history = useRef<CanvasItem[][]>([]);
  const historyStep = useRef<number>(-1);

  const handleUndo = () => {
    if (historyStep.current <= 0) return;
    historyStep.current--;
  };

  const handleRedo = () => {
    if (historyStep.current >= history.current.length - 1) return;
    historyStep.current++;
  };

  const product = PRODUCTS[productIdx];

  const handleAddElement = (element: { name: string; image: string }) => {
    setCanvasItems(items => [
      ...items,
      {
        id: Date.now(),
        src: element.image,
        x: 0,
        y: 0,
      },
    ]);
  };

  return (
    <div className="min-h-screen items-center bg-gray-100 flex flex-col justify-between">
      <NavBar />
      {/* Main area: product (fills most) + vertical buttons at side */}
      <div className=" w-full max-w-4xl flex flex-row justify-center items-center relative bg-white mt-2 mb-5">
        <CanvasArea product={product} items={canvasItems} />
        <ActionButtons onUndo={handleUndo} onRedo={handleRedo} />
      </div>
      {/* Tabs and selector at the bottom */}
      <div className="w-full bg-pink-500 pt-6 px-2 pb-2 flex flex-col items-center sticky bottom-0 z-10">
        <div className="relative w-full flex justify-center">
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        {activeTab === 'product' && (
          <ProductSelector products={PRODUCTS} selectedIdx={productIdx} onSelect={setProductIdx} />
        )}
        {activeTab === 'elements' && (
          <ElementSelector elements={ELEMENTS} onSelect={handleAddElement} />
        )}
        {activeTab === 'text' && <TextTools />}
      </div>
    </div>
  );
};

export default App;
