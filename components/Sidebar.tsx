import React from 'react';
import { MessageSquareText, Image as ImageIcon, Video, Mic, Activity } from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const menuItems = [
    { id: AppMode.TEXT, icon: MessageSquareText, label: "Text & Chat" },
    { id: AppMode.IMAGE, icon: ImageIcon, label: "Image Studio" },
    { id: AppMode.VIDEO, icon: Video, label: "Video Generation" },
    { id: AppMode.AUDIO, icon: Mic, label: "Audio & Speech" },
  ];

  return (
    <div className="w-20 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          OmniGen
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentMode === item.id
                ? 'bg-primary-600/10 text-primary-500 border border-primary-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentMode === item.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-white'}`} />
            <span className="font-medium hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 hidden md:block">
          <p className="text-xs text-gray-400">Powered by</p>
          <p className="text-sm font-semibold text-white flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Gemini 2.5 & 3.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;