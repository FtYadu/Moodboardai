import React, { useState } from 'react';
import type { MediaItem } from '../types';
import { generateImages, getSuggestionsFromAnalysis } from '../services/geminiService';
import { urlToBase64 } from '../utils/fileUtils';
import { Loader } from './Loader';

interface SuggestionsModalProps {
  show: boolean;
  onClose: () => void;
  moodboardItems: MediaItem[];
  addToMoodboard: (item: MediaItem) => void;
}

type Tab = 'keyword' | 'analyze';

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ show, onClose, moodboardItems, addToMoodboard }) => {
  const [activeTab, setActiveTab] = useState<Tab>('keyword');
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFromKeyword = async () => {
    if (!prompt) {
        setError('Please enter a keyword or prompt.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    try {
        const results = await generateImages(`A diverse set of 4 aesthetically pleasing images for a mood board with the theme: "${prompt}"`, '1:1', 4);
        setSuggestions(results);
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Failed to generate suggestions.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateFromAnalysis = async () => {
    const imageItems = moodboardItems.filter(item => item.type === 'image').slice(0, 5); // Use up to 5 images
    if (imageItems.length === 0) {
        setError('Add some images to your moodboard first to use this feature.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    try {
        const imagePayloads = await Promise.all(
            imageItems.map(item => urlToBase64(item.src))
        );
        const results = await getSuggestionsFromAnalysis(imagePayloads);
        setSuggestions(results);
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Failed to generate suggestions from analysis.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddToMoodboard = (src: string) => {
    addToMoodboard({
        id: crypto.randomUUID(),
        type: 'image',
        src,
        prompt: `Suggestion for: ${activeTab === 'keyword' ? prompt : 'moodboard analysis'}`
    });
    setSuggestions(prev => prev.filter(s => s !== src));
  };
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-600 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-dark-600 flex justify-between items-center">
          <h3 className="text-xl font-bold text-dark-text">Image Suggestions</h3>
          <button onClick={onClose} className="text-dark-text-secondary text-2xl hover:text-dark-text">&times;</button>
        </header>
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="border-b border-dark-600 mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('keyword')} className={`${activeTab === 'keyword' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-dark-text-secondary hover:text-dark-text hover:border-dark-600'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>From Keyword</button>
                    <button onClick={() => setActiveTab('analyze')} className={`${activeTab === 'analyze' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-dark-text-secondary hover:text-dark-text hover:border-dark-600'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>From Moodboard</button>
                </nav>
            </div>
            
            {activeTab === 'keyword' && (
                <div className="flex gap-2">
                    <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., 'calm desert oasis'" className="flex-grow p-2 bg-dark-700 border border-dark-600 rounded-md text-dark-text placeholder:text-dark-text-secondary" disabled={isLoading}/>
                    <button onClick={handleGenerateFromKeyword} className="bg-brand-blue text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-800" disabled={isLoading}>Generate</button>
                </div>
            )}
            {activeTab === 'analyze' && (
                <div>
                     <p className="text-sm text-dark-text-secondary mb-4">Analyzes the latest images on your moodboard to find similar themes and styles.</p>
                    <button onClick={handleGenerateFromAnalysis} className="w-full bg-brand-blue text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-800" disabled={isLoading}>Analyze & Suggest</button>
                </div>
            )}

            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            
            <div className="mt-6">
                {isLoading && <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-t-brand-blue border-dark-600 rounded-full animate-spin"></div></div>}
                {suggestions.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {suggestions.map((src, i) => (
                            <div key={i} className="relative group rounded-lg overflow-hidden">
                                <img src={src} alt={`Suggestion ${i+1}`} className="w-full h-full object-cover aspect-square" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <button onClick={() => handleAddToMoodboard(src)} className="bg-white/80 text-black text-xs font-bold py-1 px-3 rounded-full hover:bg-white">Add</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};