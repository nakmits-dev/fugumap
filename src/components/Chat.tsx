import { useState } from 'react';
import { Send, MapPin } from 'lucide-react';
import { useChatStore, useMapStore } from '../store';

export default function Chat() {
  const [message, setMessage] = useState('');
  const { messages, addMessage, username, setUsername } = useChatStore();
  const { selectedLocation } = useMapStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !username) return;

    addMessage({
      text: message,
      username,
      location: selectedLocation || undefined,
    });
    setMessage('');
  };

  if (!username) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Welcome to Fugumap</h2>
        <input
          type="text"
          placeholder="Enter your username"
          className="w-full p-2 border rounded-lg mb-2"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              setUsername(e.currentTarget.value);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.username === username ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.username === username
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p className="text-sm font-semibold">{msg.username}</p>
              <p>{msg.text}</p>
              {msg.location && (
                <div className="flex items-center mt-1 text-sm">
                  <MapPin size={16} className="mr-1" />
                  <span>
                    {msg.location.lat.toFixed(4)}, {msg.location.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        {selectedLocation && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <MapPin size={16} className="mr-1" />
            <span>Location attached</span>
          </div>
        )}
      </form>
    </div>
  );
}