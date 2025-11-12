import React, { useState, useRef } from 'react';
import { analyzeContent } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Loader } from './Loader';

export const ContentAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<{ data: File, url: string } | null>(null);
  const [result, setResult] = useState<{text: string; groundingChunks: any[] | undefined} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setFile({ data: selectedFile, url });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      let fileData;
      if (file) {
        const base64 = await fileToBase64(file.data);
        fileData = { base64, mimeType: file.data.type };
      }
      const response = await analyzeContent(prompt, fileData, useThinking, useSearch);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-dark-text">Content Analyzer</h2>
        <p className="text-dark-text-secondary mt-1">Get insights from images, videos, and text.</p>
      </header>
      <div className="bg-dark-900 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">Content (Optional)</label>
            <input type="file" onChange={handleFileChange} ref={fileInputRef} className="block w-full text-sm text-dark-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dark-700 file:text-brand-blue hover:file:bg-dark-600" disabled={isLoading} />
            {file?.data.type.startsWith('image/') && <img src={file.url} alt="Preview" className="mt-4 max-h-40 rounded-lg"/>}
            {file?.data.type.startsWith('video/') && <video src={file.url} controls className="mt-4 max-h-40 rounded-lg"/>}
          </div>
          <div className="mb-4">
            <label htmlFor="prompt-analyze" className="block text-sm font-medium text-dark-text-secondary mb-2">What do you want to analyze?</label>
            <textarea
              id="prompt-analyze"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Describe the color palette of this image. or Who won the most medals in the last Olympics?"
              className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-brand-blue focus:border-brand-blue transition text-dark-text placeholder:text-dark-text-secondary"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center">
              <input id="thinking-mode" type="checkbox" checked={useThinking} onChange={(e) => setUseThinking(e.target.checked)} className="h-4 w-4 text-brand-blue bg-dark-700 border-dark-600 rounded focus:ring-brand-blue" disabled={isLoading}/>
              <label htmlFor="thinking-mode" className="ml-2 block text-sm text-dark-text">Enable Thinking Mode (for complex tasks)</label>
            </div>
            <div className="flex items-center">
              <input id="search-mode" type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="h-4 w-4 text-brand-blue bg-dark-700 border-dark-600 rounded focus:ring-brand-blue" disabled={isLoading}/>
              <label htmlFor="search-mode" className="ml-2 block text-sm text-dark-text">Use Google Search (for recent info)</label>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? <Loader /> : 'Analyze'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
      {result && (
        <div className="mt-8 bg-dark-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-dark-text">Analysis Result</h3>
          <div className="prose prose-invert max-w-none text-dark-text" dangerouslySetInnerHTML={{ __html: result.text.replace(/\n/g, '<br />') }} />
           {result.groundingChunks && result.groundingChunks.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-dark-text mb-2">Sources</h4>
                <ul className="list-disc list-inside space-y-1">
                    {result.groundingChunks.map((chunk, index) => (
                        chunk.web && <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">{chunk.web.title || chunk.web.uri}</a></li>
                    ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
};