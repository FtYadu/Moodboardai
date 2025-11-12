import React, { useState, useRef } from 'react';
import type { MediaItem } from '../types';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Loader } from './Loader';

interface ImageEditorProps {
  addToMoodboard: (item: MediaItem) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ addToMoodboard }) => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ file: File, url: string, base64: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      setOriginalImage({ file, url, base64 });
      setEditedImage(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter an editing prompt.');
      return;
    }
    if (!originalImage) {
        setError('Please upload an image to edit.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const resultUrl = await editImage(prompt, originalImage.base64, originalImage.file.type);
      setEditedImage(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while editing the image.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddToMoodboard = () => {
    if (editedImage) {
      addToMoodboard({
        id: crypto.randomUUID(),
        type: 'image',
        src: editedImage,
        prompt: `Edited: ${prompt}`
      });
      setEditedImage(null);
      setOriginalImage(null);
      setPrompt('');
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-dark-text">Image Editor</h2>
        <p className="text-dark-text-secondary mt-1">Modify your images with descriptive commands.</p>
      </header>

      <div className="bg-dark-900 p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="image-upload" className="block text-sm font-medium text-dark-text-secondary mb-2">Upload Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-dark-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l4.172-4.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="flex text-sm text-dark-text-secondary">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-dark-900 rounded-md font-medium text-brand-blue hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" ref={fileInputRef} disabled={isLoading} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-dark-text-secondary">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-dark-text-secondary mb-2">Edit Instruction</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a retro filter, Remove the person in the background"
              className="w-full p-3 bg-dark-700 border border-dark-600 rounded-md focus:ring-brand-blue focus:border-brand-blue transition text-dark-text placeholder:text-dark-text-secondary"
              rows={2}
              disabled={isLoading || !originalImage}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !originalImage}
            className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader /> : 'Edit Image'}
          </button>
        </form>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
      
      {(originalImage || editedImage) && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {originalImage && (
            <div className="text-center bg-dark-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-dark-text">Original</h3>
              <img src={originalImage.url} alt="Original" className="max-w-full mx-auto rounded-lg shadow-lg" />
            </div>
          )}
          {editedImage && (
            <div className="text-center bg-dark-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-dark-text">Edited</h3>
              <img src={editedImage} alt="Edited" className="max-w-full mx-auto rounded-lg shadow-lg" />
              <button
                onClick={handleAddToMoodboard}
                className="mt-6 bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition duration-300"
              >
                Add to Moodboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};