import { useRef } from 'react';

const CLICK_THRESHOLD = 5; // px

export function useHorizontalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);

  // Para click seguro
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    pointerDown.current = { x: e.pageX, y: e.pageY };
    dragDistance.current = 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
    if (pointerDown.current) {
      dragDistance.current = Math.max(
        dragDistance.current,
        Math.abs(e.pageX - pointerDown.current.x),
        Math.abs(e.pageY - pointerDown.current.y)
      );
    }
  };
  const onMouseUp = () => {
    isDragging.current = false;
    // NO limpiar pointerDown ni dragDistance aquí
  };
  const onMouseLeave = () => {
    isDragging.current = false;
    // NO limpiar pointerDown ni dragDistance aquí
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    pointerDown.current = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    dragDistance.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
    if (pointerDown.current) {
      dragDistance.current = Math.max(
        dragDistance.current,
        Math.abs(e.touches[0].pageX - pointerDown.current.x),
        Math.abs(e.touches[0].pageY - pointerDown.current.y)
      );
    }
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    // NO limpiar pointerDown ni dragDistance aquí
  };

  // Handler para click seguro
  const isClick = () => dragDistance.current < CLICK_THRESHOLD;
  // Nuevo: método para limpiar el estado después de consultar isClick
  const resetDrag = () => {
    pointerDown.current = null;
    dragDistance.current = 0;
  };

  return {
    scrollRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isClick,
    resetDrag,
  };
}

// Nuevo hook para manejar selección segura de items por índice
import { useRef as useReactRef } from 'react';
import { useEffect } from 'react';

export function useSafeItemSelect({
  onSelect,
  dragScroll,
}: {
  onSelect: (idx: number) => void;
  dragScroll: ReturnType<typeof useHorizontalDragScroll> | ReturnType<typeof useVerticalDragScroll>;
}) {
  const pressedIdx = useReactRef<number | null>(null);
  const lastProcessedIdx = useReactRef<number | null>(null);
  const lastEventType = useReactRef<'mouse' | 'touch' | null>(null);
  const touchTimer = useReactRef<NodeJS.Timeout | null>(null);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (touchTimer.current) {
        clearTimeout(touchTimer.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, idx: number) => {
    if (lastEventType.current === 'touch') return;
    lastEventType.current = 'mouse';
    pressedIdx.current = idx;
    dragScroll.onMouseDown(e);
  };

  const handleMouseUp = (_e: React.MouseEvent, idx: number) => {
    if (lastEventType.current !== 'mouse' || pressedIdx.current !== idx) return;
    
    dragScroll.onMouseUp();
    if (dragScroll.isClick() && pressedIdx.current === idx) {
      // Prevent processing the same index twice
      if (lastProcessedIdx.current !== idx) {
        lastProcessedIdx.current = idx;
        onSelect(idx);
        // Reset after a short delay to allow for rapid consecutive clicks
        setTimeout(() => {
          lastProcessedIdx.current = null;
        }, 100);
      }
    }
    dragScroll.resetDrag();
    pressedIdx.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    // Clear any pending mouse events
    lastEventType.current = 'touch';
    pressedIdx.current = idx;
    dragScroll.onTouchStart(e);
  };

  const handleTouchEnd = (_e: React.TouchEvent, idx: number) => {
    if (lastEventType.current !== 'touch' || pressedIdx.current !== idx) return;
    
    dragScroll.onTouchEnd();
    if (dragScroll.isClick() && pressedIdx.current === idx) {
      // Prevent processing the same index twice
      if (lastProcessedIdx.current !== idx) {
        lastProcessedIdx.current = idx;
        onSelect(idx);
        // Reset after a short delay to allow for rapid consecutive taps
        touchTimer.current = setTimeout(() => {
          lastProcessedIdx.current = null;
        }, 100);
      }
    }
    dragScroll.resetDrag();
    pressedIdx.current = null;
  };

  return {
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
  };
}

// Nuevo: hook para scroll vertical seguro
export function useVerticalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  const dragDistance = useRef(0);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.pageY - (scrollRef.current?.offsetTop || 0);
    scrollTop.current = scrollRef.current?.scrollTop || 0;
    pointerDown.current = { x: e.pageX, y: e.pageY };
    dragDistance.current = 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const y = e.pageY - scrollRef.current.offsetTop;
    const walk = y - startY.current;
    scrollRef.current.scrollTop = scrollTop.current - walk;
    if (pointerDown.current) {
      dragDistance.current = Math.max(
        dragDistance.current,
        Math.abs(e.pageX - pointerDown.current.x),
        Math.abs(e.pageY - pointerDown.current.y)
      );
    }
  };
  const onMouseUp = () => {
    isDragging.current = false;
    // NO limpiar pointerDown ni dragDistance aquí
  };
  const onMouseLeave = () => {
    isDragging.current = false;
    // NO limpiar pointerDown ni dragDistance aquí
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startY.current = e.touches[0].pageY - (scrollRef.current?.offsetTop || 0);
    scrollTop.current = scrollRef.current?.scrollTop || 0;
    pointerDown.current = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    dragDistance.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const y = e.touches[0].pageY - scrollRef.current.offsetTop;
    const walk = y - startY.current;
    scrollRef.current.scrollTop = scrollTop.current - walk;
    if (pointerDown.current) {
      dragDistance.current = Math.max(
        dragDistance.current,
        Math.abs(e.touches[0].pageX - pointerDown.current.x),
        Math.abs(e.touches[0].pageY - pointerDown.current.y)
      );
    }
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    // NO limpiar pointerDown ni dragDistance aquí
  };

  const isClick = () => dragDistance.current < CLICK_THRESHOLD;
  const resetDrag = () => {
    pointerDown.current = null;
    dragDistance.current = 0;
  };

  return {
    scrollRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isClick,
    resetDrag,
  };
}
