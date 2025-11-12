import React, { useState, useEffect } from 'react';
import type { MediaItem } from '../types';
import { TextItemComponent } from './TextItemComponent';

interface BoardItemComponentProps {
  item: MediaItem;
  onUpdate: (id: string, updates: Partial<Omit<MediaItem, 'id'>>) => void;
  onRemove: (id: string) => void;
}

export const BoardItemComponent: React.FC<BoardItemComponentProps> = ({ item, onUpdate, onRemove }) => {
  const [interaction, setInteraction] = useState({
    active: false,
    type: '' as 'drag' | 'resize' | '',
    initial: { x: 0, y: 0, itemX: 0, itemY: 0, width: 0, height: 0 }
  });

  const position = item.position || { x: 10, y: 10 };
  const size = item.size || { width: 250, height: 250 };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!interaction.active) return;

      const dx = e.clientX - interaction.initial.x;
      const dy = e.clientY - interaction.initial.y;

      if (interaction.type === 'drag') {
        onUpdate(item.id, {
          position: {
            x: interaction.initial.itemX + dx,
            y: interaction.initial.itemY + dy,
          }
        });
      } else if (interaction.type === 'resize') {
        onUpdate(item.id, {
          size: {
            width: Math.max(50, interaction.initial.width + dx),
            height: Math.max(50, interaction.initial.height + dy),
          }
        });
      }
    };

    const handleMouseUp = () => {
      setInteraction({ ...interaction, active: false });
    };

    if (interaction.active) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, item.id, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setInteraction({
      active: true,
      type: type,
      initial: {
        x: e.clientX,
        y: e.clientY,
        itemX: position.x,
        itemY: position.y,
        width: size.width,
        height: size.height,
      }
    });
  };

  const renderContent = () => {
    const commonClasses = "w-full h-full object-cover rounded-md pointer-events-none";
    switch (item.type) {
      case 'image':
        return <img src={item.src} alt={item.prompt || ''} className={commonClasses} />;
      case 'video':
        return <video src={item.src} controls loop className={commonClasses + ' pointer-events-auto'} />;
      case 'text':
        return <TextItemComponent item={item} onRemove={onRemove} onUpdate={(id, text) => onUpdate(id, { src: text })} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="absolute bg-dark-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-blue group"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: interaction.active ? 'grabbing' : 'grab'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      tabIndex={0}
    >
      <div className="w-full h-full">
        {renderContent()}
      </div>

      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-brand-blue/80 cursor-nwse-resize rounded-br-lg hover:bg-brand-blue"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      ></div>

      <button
        onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
        }}
        className="absolute top-0 right-0 w-5 h-5 bg-dark-900 text-white rounded-full flex items-center justify-center -mt-2 -mr-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10"
        aria-label="Remove item"
      >
        &times;
      </button>
    </div>
  );
};
