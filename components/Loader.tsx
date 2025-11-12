import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 rounded-full animate-pulse bg-white/70"></div>
            <div className="w-3 h-3 rounded-full animate-pulse bg-white/70" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 rounded-full animate-pulse bg-white/70" style={{animationDelay: '0.4s'}}></div>
        </div>
    );
};