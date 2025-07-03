import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import { PRODUCTS, ELEMENTS, TABS } from '../constants';
import ProductSelector from '../components/ProductSelector';
import ElementSelector from '../components/ElementSelector';
import TextTools from '../components/TextTools';
import CanvasArea from '../components/CanvasArea';
import ActionButtons from '../components/ActionButtons';
import Tabs from '../components/Tabs';
import type { CanvasItem } from '../types';

const EditPage: React.FC = () => {
  const [productIdx, setProductIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('product');
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

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
      <div className=" w-full max-w-4xl flex flex-row justify-center items-center relative bg-white mt-2 mb-5">
        <CanvasArea product={product} items={canvasItems} />
        <ActionButtons onUndo={() => {}} onRedo={() => {}} />
      </div>
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

export default EditPage; 