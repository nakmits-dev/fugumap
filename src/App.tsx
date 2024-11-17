import React from 'react';
import Map from './components/Map';
import MessageInput from './components/MessageInput';

function App() {
  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <Map />
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <MessageInput />
      </div>
    </div>
  );
}

export default App;