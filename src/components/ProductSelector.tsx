import React from 'react';
import { useHorizontalDragScroll, useSafeItemSelect } from '../utils/ScrollUtils';

type Product = {
  name: string;
  image: string;
  canvas: { width: number; height: number; top: number };
};

type ProductSelectorProps = {
  products: Product[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
};

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedIdx, onSelect }) => {
  const dragScroll = useHorizontalDragScroll();
  const safeSelect = useSafeItemSelect({
    onSelect,
    dragScroll,
  });

  return (
    <div
      ref={dragScroll.scrollRef}
      className="flex gap-8 h-44 max-h-44 items-center w-full justify-start overflow-x-auto cursor-grab active:cursor-grabbing select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onMouseDown={dragScroll.onMouseDown}
      onMouseMove={dragScroll.onMouseMove}
      onMouseUp={dragScroll.onMouseUp}
      onMouseLeave={dragScroll.onMouseLeave}
      onTouchStart={dragScroll.onTouchStart}
      onTouchMove={dragScroll.onTouchMove}
      onTouchEnd={dragScroll.onTouchEnd}
    >
      {products.map((prod, idx) => (
        <div
          key={prod.image}
          className={`flex flex-col items-center cursor-pointer ${selectedIdx === idx ? 'ring-4 ring-pink-300' : ''}`}
          onMouseDown={e => safeSelect.handleMouseDown(e, idx)}
          onMouseUp={e => safeSelect.handleMouseUp(e, idx)}
          onTouchStart={e => safeSelect.handleTouchStart(e, idx)}
          onTouchEnd={e => safeSelect.handleTouchEnd(e, idx)}
        >
          <div className="rounded-lg bg-white p-4 shadow-md w-28 h-28 flex items-center justify-center">
            <img
              src={prod.image}
              alt={prod.name}
              className="object-contain max-w-full max-h-full"
              draggable={false}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSelector; 