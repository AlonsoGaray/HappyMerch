import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useVerticalDragScroll, useSafeItemSelect } from '../utils/ScrollUtils';
import { SketchPicker } from 'react-color';
import { Scrollbar } from 'react-scrollbars-custom';
import { useGlobalData } from '@/contexts/AdminDataContext';

const FONTS = [
  { label: 'Anton', className: 'font-anton' },
  { label: 'Apricotsy', className: 'font-apricotsy' },
  { label: 'Baloo 2', className: 'font-baloo-2' },
  { label: 'Bebas Neue', className: 'font-bebas-neue' },
  { label: 'Brittany Signature', className: 'font-brittany-signature' },
  { label: 'Bubblegum Sans', className: 'font-bubblegum-sans' },
  { label: 'Bungee', className: 'font-bungee' },
  { label: 'Chewy', className: 'font-chewy' },
  { label: 'Clementine', className: 'font-clementine-sketch' },
  { label: 'Comic Neue', className: 'font-comic-neue' },
  { label: 'Courier', className: 'font-courier' },
  { label: 'Fredoka', className: 'font-fredoka' },
  { label: 'Genty', className: 'font-genty' },
  { label: 'Georgia', className: 'font-georgia' },
  { label: 'Gloria Hallelujah', className: 'font-gloria-hallelujah' },
  { label: 'Great Vibes', className: 'font-great-vibes' },
  { label: 'Hello Honey', className: 'font-hello-honey' },
  { label: 'Henny Penny', className: 'font-henny-penny' },
  { label: 'Junglefe', className: 'font-junglefe' },
  { label: 'League Spartan', className: 'font-league-spartan' },
  { label: 'Lobster', className: 'font-lobster' },
  { label: 'Lovelo', className: 'font-lovelo' },
  { label: 'Luckiest Guy', className: 'font-luckiest-guy' },
  { label: 'Magilio', className: 'font-magilio' },
  { label: 'Montserrat', className: 'font-montserrat' },
  { label: 'Neon', className: 'font-neon-tubes' },
  { label: 'Oswald', className: 'font-oswald' },
  { label: 'Pacifico', className: 'font-pacifico' },
  { label: 'Playfair Display', className: 'font-playfair' },
  { label: 'Playlist Script', className: 'font-playlist-script' },
  { label: 'Selima', className: 'font-selima' },
  { label: 'Shadows Into Light', className: 'font-shadow' },
  { label: 'Spicy Rice', className: 'font-spicy-rice' },
  { label: 'Sunset Club', className: 'font-sunset-club' },
  { label: 'Verdana', className: 'font-verdana' },
  { label: 'Wedges', className: 'font-wedges' },
];

const COLORS = [
  '#000000', '#ffffff', '#e11d48', '#2563eb', '#22d3ee', '#16a34a', '#f59e42', '#fbbf24', '#a21caf', '#be185d',
];

interface TextToolsProps {
  onAddText?: (text: string, font: string, color: string) => void;
  selectedTextItem?: {
    id: number;
    type: 'text';
    text: string;
    font: string;
    color: string;
    x: number;
    y: number;
  };
  onUpdateTextItem?: (id: number, changes: Partial<{ font: string; color: string }>) => void;
}

const TextTools: React.FC<TextToolsProps> = ({ onAddText, selectedTextItem, onUpdateTextItem }) => {
  const { data } = useGlobalData()
  const [text, setText] = useState('');
  const [font, setFont] = useState(FONTS[0].className);
  const [color, setColor] = useState(COLORS[0]);
  const [showPalette, setShowPalette] = useState(false);

  const handleAdd = () => {
    if (text.trim() && onAddText) {
      onAddText(text, font, color);
      setText('');
    }
  };

  // Si hay texto seleccionado, usar su fuente y color como seleccionados
  React.useEffect(() => {
    if (selectedTextItem) {
      setFont(selectedTextItem.font);
      setColor(selectedTextItem.color);
    }
  }, [selectedTextItem]);

  // Scroll vertical y selección segura para fuentes
  const dragScroll = useVerticalDragScroll();
  const safeSelect = useSafeItemSelect({
    onSelect: (idx) => {
      setFont(FONTS[idx].className);
      if (selectedTextItem && onUpdateTextItem) {
        onUpdateTextItem(selectedTextItem.id, { font: FONTS[idx].className });
      }
    },
    dragScroll,
  });

  // Add custom drag-and-scroll functionality with null checks
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragScroll.scrollRef.current) return;
    const startY = e.clientY;
    const startScrollTop = dragScroll.scrollRef.current.scrollTop;
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragScroll.scrollRef.current) return;
      const deltaY = moveEvent.clientY - startY;
      dragScroll.scrollRef.current.scrollTop = startScrollTop - deltaY;
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!dragScroll.scrollRef.current) return;
    const startY = e.touches[0].clientY;
    const startScrollTop = dragScroll.scrollRef.current.scrollTop;
    const onTouchMove = (moveEvent: TouchEvent) => {
      if (!dragScroll.scrollRef.current) return;
      const deltaY = moveEvent.touches[0].clientY - startY;
      dragScroll.scrollRef.current.scrollTop = startScrollTop - deltaY;
    };
    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

  return (
    <div className="flex gap-5 w-full max-w-lg self-center items-center h-44 max-h-44 justify-center pt-5">
      <div className='flex flex-col w-2/3 gap-2'>
        <div className="flex w-full gap-2 items-center">
          <input
            className="bg-white rounded px-2 py-1 w-full text-black"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe tu texto..."
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            id="texto"
            name='texto'
            />
          <button
            className="flex text-white rounded h-8 w-8 items-center justify-center px-0.5"
            style={{backgroundColor: data.config?.main_color, mixBlendMode: 'screen' }}
            onClick={handleAdd}
            title="Agregar texto"
          >
            <Plus strokeWidth={3} color='white' size={28} />
          </button>
        </div>
        {/* Reemplazo del div scroll por Scrollbar */}
        <Scrollbar 
          className=''
          style={{ width: "100%", height: 96 }}
          contentProps={{ style: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 5 } }}
          trackYProps={{ style: { mixBlendMode: 'screen', backgroundColor: data.config?.main_color, height: '100%', top: 0 } }}
          thumbYProps={{ style: { background: '#fff'} }}
          ref={dragScroll.scrollRef as any}
          onMouseDown={handleMouseDown}
          onMouseMove={dragScroll.onMouseMove}
          onMouseUp={dragScroll.onMouseUp}
          onMouseLeave={dragScroll.onMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={dragScroll.onTouchMove}
          onTouchEnd={dragScroll.onTouchEnd}
        >
          {FONTS.map((f, idx) => (
            <button
              key={f.className}
              className={`px-3 py-1 w-[49%] rounded ${f.className}`}
              style={font === f.className ? {backgroundColor: 'white'} : {backgroundColor: data.config?.main_color, mixBlendMode: 'screen', color: 'white'}}
              onMouseDown={e => safeSelect.handleMouseDown(e, idx)}
              onMouseUp={e => safeSelect.handleMouseUp(e, idx)}
              onTouchStart={e => safeSelect.handleTouchStart(e, idx)}
              onTouchEnd={e => safeSelect.handleTouchEnd(e, idx)}
            >
              {f.label}
            </button>
          ))}
        </Scrollbar>
      </div>
      <div className="flex flex-wrap gap-2 w-1/3 justify-center relative">
        {COLORS.map(c => (
          <button
            key={c}
            className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-pink-500' : 'border-transparent'}`}
            style={{ background: c }}
            onClick={() => {
              setColor(c);
              if (selectedTextItem && onUpdateTextItem) {
                onUpdateTextItem(selectedTextItem.id, { color: c });
              }
            }}
          />
        ))}
        <button
          className="mt-2 px-2 py-1 rounded text-sm w-full text-white"
            style={{backgroundColor: data.config?.main_color, mixBlendMode: 'screen' }}
          onClick={() => setShowPalette(v => !v)}
        >
          {showPalette ? 'Cerrar paleta' : 'Abrir paleta'}
        </button>
        {showPalette && (
          <div className="absolute z-50 bottom-10 left-28 -translate-x-1/2 shadow-lg border border-gray-200 bg-white rounded">
            <SketchPicker
              color={color}
              onChange={col => {
                setColor(col.hex);
                if (selectedTextItem && onUpdateTextItem) {
                  onUpdateTextItem(selectedTextItem.id, { color: col.hex });
                }
              }}
              presetColors={COLORS}
              disableAlpha
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TextTools; 