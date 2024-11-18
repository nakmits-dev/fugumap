import React, { useState, useMemo } from 'react';
import Map from './components/Map';
import MessageInput from './components/MessageInput';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { useMapStore } from './store';
import { MessageLogModal } from './components/MessageLogModal';

function App() {
  return (
    <>
      <div className="fixed inset-0">
        <Map />
      </div>
      <div className="fixed top-4 left-4 z-50">
        <MessageCount />
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-10">
        <MessageInput />
      </div>
      <PWAInstallPrompt />
    </>
  );
}

function MessageCount() {
  const { messages } = useMapStore();
  const [showLogModal, setShowLogModal] = useState(false);
  const messageCount = useMemo(() => 
    messages.filter(msg => msg.text !== '(移動)').length,
    [messages]
  );

  return (
    <>
      <button
        onClick={() => setShowLogModal(true)}
        className="bg-black/75 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm hover:bg-black/85 transition-colors"
      >
        メッセージ数: {messageCount}
      </button>
      {showLogModal && <MessageLogModal onClose={() => setShowLogModal(false)} />}
    </>
  );
}

export default App;