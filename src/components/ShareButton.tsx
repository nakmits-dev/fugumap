import { Share2 } from 'lucide-react';
import { useMapStore } from '../store';

export function ShareButton() {
  const { userPosition } = useMapStore();

  const handleShare = async () => {
    if (!userPosition) return;

    const shareData = {
      title: 'Fugumap - リアルタイム位置情報チャット',
      text: 'Fugumapで一緒にチャットしましょう！',
      url: `https://fugumap.netlify.app/?lat=${userPosition.lat}&lng=${userPosition.lng}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('URLをコピーしました！');
      }
    } catch (error) {
      console.error('共有に失敗しました:', error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="fixed top-4 right-4 z-50 bg-black/75 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/85 transition-colors"
      aria-label="共有"
    >
      <Share2 size={20} />
    </button>
  );
}