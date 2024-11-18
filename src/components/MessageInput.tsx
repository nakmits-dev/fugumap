import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { useMapStore } from '../store';
import { generateColorFromUserId } from '../lib/colors';

const MAX_MESSAGE_LENGTH = 50;
const TUTORIAL_KEY = 'fugumap-tutorial-shown';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    username, 
    setUsername, 
    addMessage, 
    signIn, 
    isAuthenticated, 
    userId,
    isInRange 
  } = useMapStore();

  const userColor = userId ? generateColorFromUserId(userId) : '#000000';

  useEffect(() => {
    if (username && !localStorage.getItem(TUTORIAL_KEY)) {
      setShowTutorial(true);
      setTutorialStep(0);
      
      const timer = setInterval(() => {
        setTutorialStep(prev => {
          if (prev >= 2) {
            clearInterval(timer);
            setTimeout(() => {
              setShowTutorial(false);
              localStorage.setItem(TUTORIAL_KEY, 'true');
            }, 2000);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !username || !isAuthenticated || !isInRange) return;
    
    await addMessage(message.trim());
    setMessage('');
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    try {
      await signIn();
      setUsername(usernameInput.trim());
      await addMessage('(移動)');
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  const getTutorialContent = () => {
    switch (tutorialStep) {
      case 0:
        return (
          <>
            <Navigation className="inline-block mr-1 mb-1" size={18} />
            <span>マップ上の<span className="font-bold">自分のアイコン</span>をドラッグして移動できます</span>
          </>
        );
      case 1:
        return (
          <>
            <MapPin className="inline-block mr-1 mb-1" size={18} />
            <span><span className="font-bold">赤い枠内</span>にいる時だけメッセージを送信できます</span>
          </>
        );
      case 2:
        return (
          <>
            <MessageCircle className="inline-block mr-1 mb-1" size={18} />
            <span>近くのユーザーとリアルタイムのチャットを楽しみましょう！</span>
          </>
        );
      default:
        return null;
    }
  };

  if (!username) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <form onSubmit={handleUsernameSubmit} className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">ようこそ Fugumap へ</h2>
            <p className="text-gray-600 mb-6">チャットを始めるにはニックネームを入力してください</p>
            <div className="space-y-4">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.slice(0, 10))}
                placeholder="ニックネーム"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                autoFocus
              />
              <button
                type="submit"
                disabled={!usernameInput.trim()}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                開始する
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      {showTutorial && (
        <div className="fixed top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 bg-black/75 text-white px-4 py-3 rounded-xl text-center backdrop-blur-sm z-50 md:max-w-md shadow-lg transition-opacity duration-300">
          <p className="leading-relaxed text-sm">
            {getTutorialContent()}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
        <div 
          className={`flex items-center gap-2 bg-white/95 backdrop-blur-sm p-1.5 rounded-full shadow-lg ${
            !isInRange ? 'opacity-50' : ''
          }`}
          style={{ 
            border: `2px solid ${userColor}`,
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.5), 0 2px 4px ${userColor}40`
          }}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-medium"
            style={{ backgroundColor: userColor }}
          >
            {username[0]}
          </div>
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder={isInRange ? "メッセージを入力..." : "この場所では発言できません"}
              maxLength={MAX_MESSAGE_LENGTH}
              className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-500"
              disabled={!isInRange}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <button
            type="submit"
            disabled={!message.trim() || !isAuthenticated || !isInRange}
            className="w-8 h-8 flex items-center justify-center text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:opacity-80"
            style={{ backgroundColor: userColor }}
            aria-label="送信"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </>
  );
}