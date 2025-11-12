import React, { useState } from 'react';
import type { MediaItem } from '../types';
import { generateImages } from '../services/geminiService';
import { Loader } from './Loader';

interface ImageGeneratorProps {
  addToMoodboard: (item: MediaItem) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ addToMoodboard }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const images = await generateImages(prompt, aspectRatio, 1);
      if (images.length > 0) {
        setGeneratedImage(images[0]);
      } else {
        throw new Error("Image generation failed to return an image.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToMoodboard = () => {
    if (generatedImage) {
      addToMoodboard({
        id: crypto.randomUUID(),
        type: 'image',
        src: generatedImage,
        prompt: prompt
      });
      setGeneratedImage(null);
      setPrompt('');
    }
  };

  return (
    <div>
      <header className="mb-6">
          <h2 className="text-3xl font-bold text-dark-text">Image Generator</h2>
          <p className="text-dark-text-secondary mt-1">Create stunning visuals with a simple text prompt.</p>
      </header>

      <div className="bg-dark-900 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-dark-text-secondary mb-2">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic city skyline at sunset, synthwave style"
              className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-brand-blue focus:border-brand-blue transition text-dark-text placeholder:text-dark-text-secondary"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {aspectRatios.map(ar => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setAspectRatio(ar)}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${aspectRatio === ar ? 'bg-brand-blue text-white' : 'bg-dark-700 text-dark-text-secondary hover:bg-dark-600'}`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader /> : 'Generate Image'}
          </button>
        </form>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {generatedImage && (
        <div className="mt-8 text-center bg-dark-900 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-dark-text">Generated Image</h3>
            <img src={generatedImage} alt={prompt} className="max-w-full mx-auto rounded-lg shadow-lg" style={{ maxHeight: '50vh' }} />
            <button
                onClick={handleAddToMoodboard}
                className="mt-6 bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition duration-300"
            >
                Add to Moodboard
            </button>
        </div>
      )}
    </div>
  );
};