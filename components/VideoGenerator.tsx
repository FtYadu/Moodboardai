import React, { useState, useRef, useEffect } from 'react';
import type { MediaItem } from '../types';
import { generateVideo, checkVideoOperation, fetchVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import type { Operation } from '@google/genai';

interface VideoGeneratorProps {
  addToMoodboard: (item: MediaItem) => void;
}

const loadingMessages = [
  "Warming up the digital director...",
  "Rendering pixels into motion...",
  "Choreographing the frames...",
  "Finalizing your masterpiece...",
  "This can take a few minutes, hang tight!",
];

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ addToMoodboard }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">('16:9');
  const [sourceImage, setSourceImage] = useState<{ file: File, url: string, base64: string } | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [apiKeySelected, setApiKeySelected] = useState(true); // Assume true initially
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if(window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeySelected(true);
      } else {
        setApiKeySelected(false);
      }
    };
    checkApiKey();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);


  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true); // Assume success to avoid race condition
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      setSourceImage({ file, url, base64 });
    }
  };
  
  const pollOperation = (operation: Operation) => {
    pollingRef.current = window.setInterval(async () => {
      try {
        const updatedOp = await checkVideoOperation(operation);
        if (updatedOp.done) {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          if (updatedOp.response?.generatedVideos?.[0]?.video?.uri) {
            const videoBlob = await fetchVideo(updatedOp.response.generatedVideos[0].video.uri);
            const videoUrl = URL.createObjectURL(videoBlob);
            setGeneratedVideo(videoUrl);
          } else {
            setError("Video generation finished but no video was returned.");
          }
          setIsLoading(false);
        }
      } catch (err) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setError(err instanceof Error ? err.message : 'Polling for video status failed.');
        setIsLoading(false);
      }
    }, 10000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !sourceImage) {
      setError('Please enter a prompt or upload an image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    setLoadingMessage(loadingMessages[0]);
    
    try {
      const imagePayload = sourceImage ? { imageBytes: sourceImage.base64, mimeType: sourceImage.file.type } : undefined;
      const initialOperation = await generateVideo(prompt, imagePayload, aspectRatio);
      pollOperation(initialOperation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes("Requested entity was not found.")) {
          setError("API Key error. Please select your key again.");
          setApiKeySelected(false);
      } else {
          setError(errorMessage);
      }
      setIsLoading(false);
      console.error(err);
    }
  };

  const handleAddToMoodboard = () => {
    if (generatedVideo) {
      addToMoodboard({
        id: crypto.randomUUID(),
        type: 'video',
        src: generatedVideo,
        prompt: prompt
      });
      setGeneratedVideo(null);
      setPrompt('');
      setSourceImage(null);
    }
  };

  if (!apiKeySelected) {
    return (
        <div className="text-center p-8 bg-dark-900 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-dark-text">API Key Required for Video Generation</h2>
            <p className="mb-6 text-dark-text-secondary">The Veo video generation model requires you to select an API key. This helps manage resource allocation for this powerful feature.</p>
            <p className="text-sm text-dark-text-secondary mb-6">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">billing documentation</a>.</p>
            <button onClick={handleSelectKey} className="bg-brand-blue text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700 transition duration-300">
                Select API Key
            </button>
        </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-dark-text">Video Generator</h2>
        <p className="text-dark-text-secondary mt-1">Animate images or create videos from text prompts.</p>
      </header>

      <div className="bg-dark-900 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="prompt-video" className="block text-sm font-medium text-dark-text-secondary mb-2">Prompt</label>
            <textarea
              id="prompt-video"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A neon hologram of a cat driving at top speed"
              className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-brand-blue focus:border-brand-blue transition text-dark-text placeholder:text-dark-text-secondary"
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
             <label className="block text-sm font-medium text-dark-text-secondary mb-2">Source Image (Optional)</label>
             <input type="file" onChange={handleFileChange} accept="image/*" ref={fileInputRef} className="block w-full text-sm text-dark-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dark-700 file:text-brand-blue hover:file:bg-dark-600" disabled={isLoading} />
             {sourceImage && <img src={sourceImage.url} alt="Source" className="mt-4 max-h-32 rounded-lg"/>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">Aspect Ratio</label>
            <div className="flex gap-2">
              {(['16:9', '9:16'] as const).map(ar => (
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
            {isLoading ? (
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingMessage}</span>
                </div>
            ) : 'Generate Video'}
          </button>
        </form>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {generatedVideo && (
        <div className="mt-8 text-center bg-dark-900 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-dark-text">Generated Video</h3>
            <video src={generatedVideo} controls className="max-w-full mx-auto rounded-lg shadow-lg" style={{ maxHeight: '50vh' }} />
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