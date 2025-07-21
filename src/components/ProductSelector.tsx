import React from 'react';
import { useHorizontalDragScroll, useSafeItemSelect } from '../utils/ScrollUtils';
import { useGlobalData } from '../contexts/AdminDataContext';

export type Product = {
  id: string;
  name: string;
  url: string;
  visible: boolean;
  width: number; 
  height: number; 
  top: number;
  left: number;
  imageWidth: number;
  imageHeight: number;
};

type ProductSelectorProps = {
  onSelect: (idx: number) => void;
};

const ProductSelector: React.FC<ProductSelectorProps> = ({ onSelect }) => {
  const { data } = useGlobalData();
  const dragScroll = useHorizontalDragScroll();
  const safeSelect = useSafeItemSelect({
    onSelect,
    dragScroll,
  });

  const visibleProducts: Product[] = data.products.filter((product: Product) => product.visible);

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
      {visibleProducts.length === 0 && <span className="text-white/70">No hay productos disponibles</span>}
      {visibleProducts.map((prod, idx) => (
        <div
          key={prod.name}
          className={`flex flex-col items-center cursor-pointer`}
          onMouseDown={e => safeSelect.handleMouseDown(e, idx)}
          onMouseUp={e => safeSelect.handleMouseUp(e, idx)}
          onTouchStart={e => safeSelect.handleTouchStart(e, idx)}
          onTouchEnd={e => safeSelect.handleTouchEnd(e, idx)}
        >
          <div className="rounded-lg bg-white p-4 shadow-md w-28 h-28 flex items-center justify-center">
            <img
              src={prod.url}
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