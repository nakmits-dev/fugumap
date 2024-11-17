import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useMapStore } from '../store';
import { generateColorFromUserId } from '../lib/colors';

interface MessageLogModalProps {
  onClose: () => void;
}

export function MessageLogModal({ onClose }: MessageLogModalProps) {
  const { messages } = useMapStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const sortedMessages = [...messages]
    .filter(msg => msg.text !== '(移動)')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16 md:pt-4 md:items-center">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">メッセージログ</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedMessages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">メッセージはありません</p>
          ) : (
            sortedMessages.map(msg => (
              <div
                key={msg.id}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: generateColorFromUserId(msg.userId) }}
                >
                  {msg.username[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium">{msg.username}</span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 break-words">{msg.text}</p>
                  <div className="text-xs text-gray-400 mt-1 truncate">
                    {msg.position.lat.toFixed(6)}, {msg.position.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}