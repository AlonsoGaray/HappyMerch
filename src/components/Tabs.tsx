import { useGlobalData } from "@/contexts/AdminDataContext";

type Tab = { key: string; label: string };

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  const { data } = useGlobalData();
  
  return (
    <div className="absolute -top-5 flex gap-2">
    {tabs.map(tab => (
      <button
        key={tab.key}
        className={`relative px-5 min-h-9 flex items-center justify-center rounded-lg font-bold text-base
          ${activeTab === tab.key
            && 'outline-2 outline-black'}
        `}
        onClick={() => onTabChange(tab.key)}
        style={{
          backgroundColor: activeTab === tab.key ? data.config?.active_btn_bg_color : data.config?.inactive_btn_bg_color,
          color: activeTab === tab.key ? data.config?.active_btn_text_color : data.config?.inactive_btn_text_color,
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
)};

export default Tabs; 