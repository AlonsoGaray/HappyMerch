import { Layers, Redo, SquareDashed, Undo, ZoomIn, ZoomOut } from 'lucide-react';

interface BottomBarProps {
  selectedId: number | null;
  onToggleDashedBorder: () => void;
  onToggleLayers: () => void;
  onZoom: (factor: number) => void; // Nueva prop para zoom global
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}
  

const BottomBar: React.FC<BottomBarProps> = ({ onToggleDashedBorder, onToggleLayers, onZoom, onUndo, onRedo, canUndo = false, canRedo = false  }) => (
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
    <button
      onClick={onUndo}
      disabled={!canUndo}
      className="rounded-full p-2 transition"
      style={{
        backgroundColor: canUndo ? "black" : "gray",
      }}
      title="Deshacer (Ctrl+Z)"
    >
      <Undo color='white'/>
    </button>
    <button
      onClick={onRedo}
      disabled={!canRedo}
      className="rounded-full p-2 transition"
      style={{
        backgroundColor: canRedo ? "black" : "gray",
      }}
      title="Rehacer (Ctrl+Y)"
    >
      <Redo color='white'/>
    </button>
  </div>
);

export default BottomBar;