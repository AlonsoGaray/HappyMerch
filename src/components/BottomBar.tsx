import { Layers, SquareDashed, ZoomIn, ZoomOut } from 'lucide-react';

interface BottomBarProps {
  selectedId: number | null;
  onResize: (id: number, factor: number) => void;
  onToggleDashedBorder: () => void;
  onToggleLayers: () => void;
  onZoom: (factor: number) => void; // Nueva prop para zoom global
}
  

const BottomBar: React.FC<BottomBarProps> = ({ selectedId, onResize, onToggleDashedBorder, onToggleLayers, onZoom }) => (
  <div
    className="gap-16 flex justify-around z-50]"
  >
    <button 
      className='rounded-full bg-black p-2 disabled:bg-gray-500'
      onClick={onToggleLayers}
    >
      <Layers color='white'/>
    </button>
    <button className='rounded-full bg-black p-2' onClick={onToggleDashedBorder} title="Mostrar/ocultar borde">
      <SquareDashed color='white'/>
    </button>
    <button
      className='rounded-full bg-black p-2'
      onClick={() => onZoom(1.15)}
      title="Agrandar"
    >
      <ZoomIn color='white'/>
    </button>
    <button
      className='rounded-full bg-black p-2'
      onClick={() => onZoom(0.85)}
      title="Reducir"
    >
      <ZoomOut color='white'/>
    </button>
  </div>
);

export default BottomBar;