import { Layers, SquareDashed, ZoomIn, ZoomOut } from 'lucide-react';

interface BottomBarProps {
    selectedId: number | null;
    onResize: (id: number, factor: number) => void;
  }
  

const BottomBar: React.FC<BottomBarProps> = ({selectedId, onResize}) => (
    {selectedId && 
    <div className='w-full flex justify-around z-50 max-w-[400px]'>
        <button className='rounded-full bg-black p-2'>
        <Layers color='white'/>
        </button>
        <button className='rounded-full bg-black p-2'>
        <SquareDashed color='white'/>
        </button>
        <button className='rounded-full bg-black p-2' onClick={() => onResize(selectedId, 1.15)} title="Agrandar">
        <ZoomIn color='white'/>
        </button>
        <button className='rounded-full bg-black p-2' onClick={() => onResize(selectedId, 0.85)} title="Reducir">
        <ZoomOut color='white'/>
        </button>
    </div>
    }
)

export default BottomBar;