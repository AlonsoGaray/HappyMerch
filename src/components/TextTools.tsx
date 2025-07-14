import { Plus } from 'lucide-react';
import React, { useState } from 'react';

const FONTS = [
  { label: 'Pacifico', className: 'font-pacifico' },
  { label: 'Anton', className: 'font-anton' },
  { label: 'Lobster', className: 'font-lobster' },
  { label: 'Oswald', className: 'font-oswald' },
  { label: 'Shadows Into Light', className: 'font-shadow' },
  { label: 'Playfair Display', className: 'font-playfair' },
  { label: 'Montserrat', className: 'font-montserrat' },
  { label: 'Verdana', className: 'font-verdana' },
  { label: 'Courier', className: 'font-courier' },
  { label: 'Georgia', className: 'font-georgia' },
  { label: 'Sans', className: 'font-sans' },
  { label: 'Serif', className: 'font-serif' },
  { label: 'Mono', className: 'font-mono' }
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
  const [text, setText] = useState('');
  const [font, setFont] = useState(FONTS[0].className);
  const [color, setColor] = useState(COLORS[0]);

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

  return (
    <div className="flex gap-2 w-full max-w-lg items-center">
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
            className="flex bg-pink-300 text-white rounded h-8 w-8 items-center justify-center px-0.5"
            onClick={handleAdd}
            title="Agregar texto"
          >
            <Plus strokeWidth={3} color='oklch(65.6% 0.241 354.308)' size={28} />
          </button>
        </div>
        <div className="scroll flex flex-wrap gap-2 mb-2 w-full justify-between max-h-20 overflow-y-scroll pr-1">
          {FONTS.map(f => (
            <button
            key={f.className}
            className={`px-3 py-1 w-[48%] rounded ${font === f.className ? 'bg-pink-200' : 'bg-pink-300'} ${f.className}`}
              onClick={() => {
                setFont(f.className);
                if (selectedTextItem && onUpdateTextItem) {
                  onUpdateTextItem(selectedTextItem.id, { font: f.className });
                }
              }}
              >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 w-1/3 justify-center">
        {COLORS.map(c => (
          <button
            key={c}
            className={`w-7 h-7 rounded-full`}
            style={{ background: c }}
            onClick={() => {
              setColor(c);
              if (selectedTextItem && onUpdateTextItem) {
                onUpdateTextItem(selectedTextItem.id, { color: c });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TextTools; 