type Fondo = {
    name: string;
    image: string;
  };
  
  type BgSelectorProps = {
  fondos: Fondo[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
};

const BgSelector: React.FC<BgSelectorProps> = ({ fondos, selectedIdx, onSelect }) => (
  <div className="flex gap-8 h-44 max-h-44 items-center w-full justify-center pl-14">
    {/* Opción "Sin fondo" */}
    <button
      className={`rounded-lg p-1 transition ${selectedIdx === -1 ? 'ring-4 ring-pink-300' : ''}`}
      onClick={() => onSelect(-1)}
    >
      <div className="w-28 h-28 bg-white rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-xs text-center">Sin fondo</span>
      </div>
    </button>
    {fondos.map((bg, idx) => (
      <button
        key={bg.image}
        className={`rounded-lg p-1 transition ${selectedIdx === idx ? 'ring-4 ring-pink-300' : ''}`}
        onClick={() => onSelect(idx)}
      >
        <img
          src={bg.image}
          alt={bg.name}
          className="w-28 h-28 object-contain bg-white rounded-lg"
          draggable={false}
        />
      </button>
    ))}
  </div>
);
  
  export default BgSelector; 