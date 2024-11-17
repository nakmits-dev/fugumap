import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useMapStore } from './store';

// アプリケーションの初期化処理を関数化
const initializeApp = async () => {
  try {
    // 既存の状態をリセット
    useMapStore.getState().reset();
    
    // 認証の初期化を待機
    await useMapStore.getState().initializeAuth();
    
    // 認証完了後にレンダリング
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

// 初期化を実行
initializeApp();