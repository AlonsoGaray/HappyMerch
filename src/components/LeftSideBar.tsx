import { Grid3x3, RefreshCcw, RotateCw, MoveUpLeft, MoveUpRight, MoveDownLeft, MoveDownRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';

interface LeftSidebarProps {
  selectedId: number | null;
  onRotate: (id: number, angle: number) => void;
  onAlign?: (id: number, position: string) => void;
}

const ALIGN_GRID = [
  ['top-left', 'top', 'top-right'],
  ['left', 'center', 'right'],
  ['bottom-left', 'bottom', 'bottom-right'],
];

const ALIGN_ICONS: Record<string, React.ReactNode> = {
  'top-left': <MoveUpLeft size={18} />, // ↖
  'top': <ArrowUp size={18} />,        // ↑
  'top-right': <MoveUpRight size={18} />, // ↗
  'left': <ArrowLeft size={18} />,     // ←
  'center': <Circle size={14} fill="black" />, // •
  'right': <ArrowRight size={18} />,   // →
  'bottom-left': <MoveDownLeft size={18} />, // ↙
  'bottom': <ArrowDown size={18} />,   // ↓
  'bottom-right': <MoveDownRight size={18} />, // ↘
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  selectedId,
  onRotate,
  onAlign,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!showPopover) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopover]);

  // Handler para alineación
  const handleAlign = (position: string) => {
    if (selectedId !== null && onAlign) {
      onAlign(selectedId, position);
    }
    setShowPopover(false);
  };

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-10 flex flex-col justify-around z-50 gap-12">
      <div className="relative">
        <button
          ref={buttonRef}
          className='rounded-full bg-black p-2 disabled:bg-gray-500'
          disabled={selectedId === null}
          onClick={() => setShowPopover(v => !v)}
          title="Alinear"
        >
          <Grid3x3 color="white" />
        </button>
        {showPopover && (
          <div
            ref={popoverRef}
            className="absolute w-32 left-12 -top-10 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 flex flex-col items-center"
          >
            <div className="grid grid-cols-3 gap-1">
              {ALIGN_GRID.flat().map((pos) => (
                <button
                  key={pos}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-pink-200 text-lg border border-gray-200"
                  onClick={() => handleAlign(pos)}
                  disabled={selectedId === null}
                  title={pos}
                >
                  {ALIGN_ICONS[pos]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        className='rounded-full bg-black p-2 disabled:bg-gray-500'
        disabled={selectedId === null}
        onClick={() => { if (selectedId !== null) onRotate(selectedId, -999); }}
        title="Centrar"
      >
        <RefreshCcw color='white' />
      </button>
      <button
        className='rounded-full bg-black p-2 disabled:bg-gray-500'
        disabled={selectedId === null}
        onClick={() => { if (selectedId !== null) onRotate(selectedId, 90); }}
      >
        <RotateCw color='white' />
      </button>
    </div>
  );
};

export default LeftSidebar; 