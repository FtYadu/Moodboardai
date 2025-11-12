import React, { useState, useRef, useEffect } from 'react';
import type { MediaItem } from '../types';

interface TextItemComponentProps {
  item: MediaItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newText: string) => void;
}

export const TextItemComponent: React.FC<TextItemComponentProps> = ({ item, onRemove, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.src);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() === '') {
        onRemove(item.id);
    } else {
        onUpdate(item.id, text);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="relative group bg-dark-700 p-4 rounded-lg shadow-md h-full flex flex-col justify-center">
        {isEditing ? (
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                className="bg-transparent text-dark-text w-full resize-none focus:outline-none"
            />
        ) : (
            <p onClick={() => setIsEditing(true)} className="text-dark-text whitespace-pre-wrap cursor-pointer">
                {item.src}
            </p>
        )}
       <button
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 w-6 h-6 bg-dark-900/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove item"
      >
        &times;
      </button>
    </div>
  );
};
