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

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedIdx, onSelect }) => (
  <div className="flex gap-8 h-32 max-h-32 items-center">
    {products.map((prod, idx) => (
      <button
        key={prod.image}
        className={`rounded-lg p-1 transition ${selectedIdx === idx ? 'ring-4 ring-pink-300' : ''}`}
        onClick={() => onSelect(idx)}
      >
        <img
          src={prod.image}
          alt={prod.name}
          className="w-24 h-28 object-contain bg-white rounded-lg"
          draggable={false}
        />
      </button>
    ))}
  </div>
);

export default ProductSelector; 