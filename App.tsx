import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Moodboard } from './components/Moodboard';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { ContentAnalyzer } from './components/ContentAnalyzer';
import { Chatbot } from './components/Chatbot';
import type { View, MediaItem } from './types';
import { View as ViewEnum } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(ViewEnum.MOODBOARD);
  const [moodboardItems, setMoodboardItems] = useState<MediaItem[]>([]);

  const addToMoodboard = (item: MediaItem) => {
    setMoodboardItems(prevItems => [...prevItems, item]);
    setCurrentView(ViewEnum.MOODBOARD);
  };

  const removeFromMoodboard = (id: string) => {
    setMoodboardItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const updateBoardItem = (id: string, updates: Partial<Omit<MediaItem, 'id'>>) => {
    setMoodboardItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const renderView = () => {
    switch (currentView) {
      case ViewEnum.MOODBOARD:
        return <Moodboard items={moodboardItems} onRemove={removeFromMoodboard} onUpdateItem={updateBoardItem} addToMoodboard={addToMoodboard} />;
      case ViewEnum.IMAGE_GENERATE:
        return <ImageGenerator addToMoodboard={addToMoodboard} />;
      case ViewEnum.IMAGE_EDIT:
        return <ImageEditor addToMoodboard={addToMoodboard} />;
      case ViewEnum.VIDEO_GENERATE:
        return <VideoGenerator addToMoodboard={addToMoodboard} />;
      case ViewEnum.ANALYZE:
        return <ContentAnalyzer />;
      case ViewEnum.CHAT:
        return <Chatbot />;
      default:
        return <Moodboard items={moodboardItems} onRemove={removeFromMoodboard} onUpdateItem={updateBoardItem} addToMoodboard={addToMoodboard} />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-800 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
