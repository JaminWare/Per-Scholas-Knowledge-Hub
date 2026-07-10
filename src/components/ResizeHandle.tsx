import { useCallback, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ResizeHandle({ onResize, onDragStart, onDragEnd }: ResizeHandleProps) {
  const dragging = useRef(false);
  const startX = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onDragStart?.();
  }, [onDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    startX.current = e.clientX;
    onResize(delta);
  }, [onResize]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    onDragEnd?.();
  }, [onDragEnd]);

  useEffect(() => {
    const preventSelection = (e: Event) => {
      if (dragging.current) e.preventDefault();
    };
    document.addEventListener('selectstart', preventSelection);
    return () => document.removeEventListener('selectstart', preventSelection);
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="hidden md:flex w-1.5 flex-shrink-0 cursor-col-resize items-center justify-center rounded-full my-4 bg-zinc-800 hover:bg-zinc-600 active:bg-blue-500/60 transition-colors z-10 select-none touch-none"
    />
  );
}
