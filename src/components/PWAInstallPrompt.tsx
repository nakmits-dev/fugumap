import { useState, useEffect } from 'react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white rounded-lg shadow-lg p-4 z-50">
      <p className="text-sm text-gray-600 mb-3">
        Fugumapをホーム画面に追加して、より快適に利用できます
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowPrompt(false)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          後で
        </button>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          インストール
        </button>
      </div>
    </div>
  );
}