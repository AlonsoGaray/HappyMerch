type Tab = { key: string; label: string };

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="absolute -top-10 flex gap-2">
  {tabs.map(tab => (
    <button
      key={tab.key}
      className={`relative px-5 min-h-9 flex items-center justify-center rounded-lg font-bold text-base
        ${activeTab === tab.key
          ? 'bg-white text-pink-700 border-2 border-black z-20'
          : 'bg-teal-500 text-white border-b-4 border-transparent z-0'}
      `}
      onClick={() => onTabChange(tab.key)}
    >
      {tab.label}
    </button>
  ))}
</div>

);

export default Tabs; 