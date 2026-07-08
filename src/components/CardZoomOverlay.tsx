import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface CardZoomOverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function CardZoomOverlay({ open, onClose, children }: CardZoomOverlayProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative z-10 max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800/50 shadow-lg animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-300 transition-colors"
          aria-label="Close zoom"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="card-zoom-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
