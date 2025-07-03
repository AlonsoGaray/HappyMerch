import React from 'react';

type ActionButtonsProps = {
  onUndo: () => void;
  onRedo: () => void;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ onUndo, onRedo }) => (
  <div className="flex flex-col gap-4">
    <button onClick={onUndo} className="bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition">Undo</button>
    <button onClick={onRedo} className="bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition">Redo</button>
  </div>
);

export default ActionButtons; 