# Fugumap - リアルタイム位置情報チャット

Fugumapは、地図上で近くのユーザーとリアルタイムにチャットができるウェブアプリケーションです。位置情報を共有して、その場所ならではの会話を楽しむことができます。

## 主な機能

- リアルタイムチャット
- 位置情報の共有
- PWA対応（オフライン動作可能）
- レスポンシブデザイン
- SNSシェア機能

## 技術スタック

- React
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore)
- Google Maps API
- Vite
- PWA (Service Workers)

## 環境変数

以下の環境変数が必要です：

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
```

## 開発環境のセットアップ

1. リポジトリをクローン
2. 依存関係をインストール
   ```bash
   npm install
   ```
3. 環境変数を設定
4. 開発サーバーを起動
   ```bash
   npm run dev
   ```

## ビルドと本番環境へのデプロイ

```bash
npm run build
```

## ライセンス

MIT License