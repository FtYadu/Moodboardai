import React, { useState, useRef } from 'react';
import type { MediaItem } from '../types';
import { Layout } from '../types';
import { SuggestionsModal } from './SuggestionsModal';
import { TextItemComponent } from './TextItemComponent';
import { BoardItemComponent } from './BoardItemComponent';


interface MoodboardProps {
  items: MediaItem[];
  onRemove: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<Omit<MediaItem, 'id'>>) => void;
  addToMoodboard: (item: MediaItem) => void;
}

export const Moodboard: React.FC<MoodboardProps> = ({ items, onRemove, onUpdateItem, addToMoodboard }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [layout, setLayout] = useState<Layout>(Layout.GRID);
    const [gap, setGap] = useState(16); // in pixels
    const [itemSize, setItemSize] = useState(250); // in pixels for grid base size
    const boardRef = useRef<HTMLDivElement>(null);

    const addTextItem = () => {
        let position;
        if (layout === Layout.FREEFORM && boardRef.current) {
            position = {
                x: boardRef.current.scrollLeft + 20,
                y: boardRef.current.scrollTop + 20,
            };
        }
        const newItem: MediaItem = {
            id: crypto.randomUUID(),
            type: 'text',
            src: 'New Note',
            prompt: 'Text Note',
            position,
            size: { width: 200, height: 100 }
        };
        addToMoodboard(newItem);
    };

    const renderGridItem = (item: MediaItem) => {
        switch (item.type) {
            case 'image':
                return (
                    <div className="relative group w-full h-full">
                        <img src={item.src} alt={item.prompt || 'Moodboard image'} className="w-full h-full object-cover rounded-lg shadow-lg" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white text-xs flex flex-col justify-end">
                            <p className="truncate">{item.prompt}</p>
                        </div>
                         <button
                            onClick={() => onRemove(item.id)}
                            className="absolute top-2 right-2 w-6 h-6 bg-dark-900/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove item"
                        >
                            &times;
                        </button>
                    </div>
                );
            case 'video':
                return (
                    <div className="relative group w-full h-full">
                        <video src={item.src} controls loop className="w-full h-full object-cover rounded-lg shadow-lg" />
                         <button
                            onClick={() => onRemove(item.id)}
                            className="absolute top-2 right-2 w-6 h-6 bg-dark-900/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Remove item"
                        >
                            &times;
                        </button>
                    </div>
                );
            case 'text':
                return <TextItemComponent item={item} onRemove={onRemove} onUpdate={(id, text) => onUpdateItem(id, {src: text})} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-dark-text">My Moodboard</h2>
                    <p className="text-dark-text-secondary mt-1">Collect and organize your creative inspiration.</p>
                </div>
                <div className="flex items-center gap-4 bg-dark-900 p-2 rounded-lg">
                     <div className="flex items-center gap-1 p-1 bg-dark-700 rounded-md">
                        <button onClick={() => setLayout(Layout.GRID)} className={`px-3 py-1 text-sm rounded transition-colors ${layout === Layout.GRID ? 'bg-brand-blue text-white' : 'text-dark-text-secondary hover:bg-dark-600'}`}>Grid</button>
                        <button onClick={() => setLayout(Layout.FREEFORM)} className={`px-3 py-1 text-sm rounded transition-colors ${layout === Layout.FREEFORM ? 'bg-brand-blue text-white' : 'text-dark-text-secondary hover:bg-dark-600'}`}>Canvas</button>
                    </div>
                    {layout === Layout.GRID && (
                        <>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-dark-text-secondary whitespace-nowrap">Gap</label>
                                <input type="range" min="0" max="48" value={gap} onChange={e => setGap(Number(e.target.value))} className="w-24 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-dark-text-secondary">Size</label>
                                <input type="range" min="150" max="500" value={itemSize} onChange={e => setItemSize(Number(e.target.value))} className="w-24 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </>
                    )}
                </div>
                 <div className="flex gap-2">
                    <button onClick={addTextItem} className="bg-dark-700 text-dark-text font-semibold px-4 py-2 rounded-md hover:bg-dark-600 transition">
                        Add Note
                    </button>
                    <button onClick={() => setShowSuggestions(true)} className="bg-brand-blue text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition">
                        Get Suggestions
                    </button>
                </div>
            </header>
            
            <div className="flex-grow">
                {items.length === 0 ? (
                    <div className="text-center py-20 px-6 border-2 border-dashed border-dark-700 rounded-lg h-full flex flex-col justify-center items-center">
                        <svg className="mx-auto h-12 w-12 text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <h3 className="mt-2 text-xl font-medium text-dark-text">Your moodboard is empty</h3>
                        <p className="mt-1 text-sm text-dark-text-secondary">Start by generating an image or adding a note!</p>
                    </div>
                ) : layout === Layout.GRID ? (
                    <div className="grid" style={{ 
                        gap: `${gap}px`,
                        gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))`,
                        gridAutoRows: `${itemSize}px`
                    }}>
                        {items.map(item => (
                            <div key={item.id} className="rounded-lg overflow-hidden relative">
                               {renderGridItem(item)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div ref={boardRef} className="relative w-full h-full border border-dark-700 rounded-lg overflow-auto bg-dark-900 bg-[radial-gradient(#4a5568_1px,transparent_1px)] [background-size:16px_16px]">
                        {items.map(item => (
                            <BoardItemComponent 
                                key={item.id}
                                item={item}
                                onUpdate={onUpdateItem}
                                onRemove={onRemove}
                            />
                        ))}
                    </div>
                )}
            </div>

            <SuggestionsModal 
                show={showSuggestions} 
                onClose={() => setShowSuggestions(false)}
                moodboardItems={items}
                addToMoodboard={addToMoodboard}
            />
        </div>
    );
};
