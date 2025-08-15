interface BubbleProps {
  normalText: string;
  boldText: string;
  setShowBubble: React.Dispatch<React.SetStateAction<boolean>>;
}

const Bubble = ({ normalText, boldText, setShowBubble }: BubbleProps) => {
    return (
      <div className="relative">
      <div className="absolute z-50">
        <button
          className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow focus:outline-none"
          onClick={() => setShowBubble(false)}
        >
          ×
        </button>
      </div>
      <div className="bg-white border border-black rounded-full px-5 py-4 text-center max-w-[140px] min-w-[120px] relative flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
        <span className="block text-xs font-bold leading-tight">{normalText} <span className="font-black">{boldText}</span></span>
      </div>
    </div>
    );
};

export default Bubble;