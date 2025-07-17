import React from 'react';

type Element = {
  name: string;
  image: string;
};

type ElementSelectorProps = {
  elements: Element[];
  onSelect?: (element: Element) => void;
};

const ElementSelector: React.FC<ElementSelectorProps> = ({ elements, onSelect }) => (
  <div className="flex gap-5 pl-14 h-44 max-h-44 items-center overflow-auto w-full justify-center">
    {elements.length === 0 && <span className="text-white/70">No elements</span>}
    {elements.map((el) => (
      <div key={el.image} className="flex flex-col items-center cursor-pointer" onClick={() => onSelect && onSelect(el)}>
        <div className="rounded-lg bg-white p-4 shadow-md w-28 h-28 flex items-center justify-center">
          <img src={el.image} alt={el.name} className="object-contain max-w-full max-h-full" draggable={false} />
        </div>
      </div>
    ))}
  </div>
);

export default ElementSelector; 