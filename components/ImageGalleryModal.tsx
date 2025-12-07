import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Attachment } from '../types';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Attachment[];
  initialIndex: number;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync internal state if initialIndex changes when opening
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
      >
        <X size={24} />
      </button>

      {/* Navigation Left */}
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Main Content */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center">
        <img 
          src={currentImage.url} 
          alt={currentImage.name} 
          className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
        />
        
        {/* Caption & Counter */}
        <div className="mt-4 flex items-center gap-4 text-white/90">
           <div className="flex flex-col items-center">
             <span className="text-sm font-medium">{currentImage.name}</span>
             <span className="text-xs text-white/50">{currentIndex + 1} de {images.length}</span>
           </div>
           
           <a 
             href={currentImage.url} 
             download={currentImage.name}
             target="_blank"
             rel="noreferrer"
             className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
             title="Baixar imagem"
           >
             <Download size={16} />
           </a>
        </div>
      </div>

      {/* Navigation Right */}
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Click outside to close (Overlay) */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};