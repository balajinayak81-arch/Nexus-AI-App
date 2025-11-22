import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { TextMode } from './views/TextMode';
import { ImageMode } from './views/ImageMode';
import { VideoMode } from './views/VideoMode';
import { AudioMode } from './views/AudioMode';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.TEXT);

  const renderView = () => {
    switch (mode) {
      case AppMode.TEXT: return <TextMode />;
      case AppMode.IMAGE: return <ImageMode />;
      case AppMode.VIDEO: return <VideoMode />;
      case AppMode.AUDIO: return <AudioMode />;
      default: return <TextMode />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans">
      <Sidebar currentMode={mode} setMode={setMode} />
      <main className="flex-1 h-full overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="relative z-10 h-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;