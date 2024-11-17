import { useEffect, useRef } from 'react';
import { useMapStore } from '../store';

interface MessageProps {
  id: string;
  name: string;
  text: string;
  position: { x: number; y: number };
  color: string;
  isUser?: boolean;
}

export function Message({ id, name, text, position, color }: MessageProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { markMessageAsRead } = useMapStore();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.opacity = '1';
    element.style.transform = 'translate(-50%, -100%) translateY(-12px)';

    timeoutRef.current = setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translate(-50%, -100%) translateY(-24px)';
      
      setTimeout(() => {
        markMessageAsRead(id);
      }, 300);
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, markMessageAsRead]);

  return (
    <div
      ref={elementRef}
      className="fixed z-20 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: '0',
        transform: 'translate(-50%, -100%) translateY(0)',
        transition: 'all 150ms ease-out'
      }}
    >
      <div 
        className="relative backdrop-blur-sm text-white rounded-lg px-3 py-2 text-sm shadow-lg max-w-[280px] md:max-w-[320px]"
        style={{
          backgroundColor: `${color}CC`,
          marginBottom: '12px'
        }}
      >
        <div className="font-medium text-xs text-white/90 mb-0.5">{name}</div>
        <div className="break-words leading-snug">{text}</div>
        <div
          className="absolute w-0 h-0"
          style={{
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${color}CC`
          }}
        />
      </div>
    </div>
  );
}