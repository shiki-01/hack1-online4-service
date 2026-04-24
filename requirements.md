# STACKS 要件定義書 (Svelte 5 + MasterCSS + PWA対応版)

## 1. アプリ概要

- **プロダクト名**: STACKS
- **キャッチコピー**: 忙しさを、美しく
- **目的**: 溜まったタスクの解消をより楽しく、より簡単にするインテリア型タスク管理ソリューション
- **ターゲット**: 日常タスク管理を楽しくしたい個人ユーザー（学生/ビジネスパーソン）
- **フレームワーク**: Svelte 5 + MasterCSS
- **PWA対応**: ホーム画面追加、オフライン動作、プッシュ通知
- **バックエンド**: Firebase (Authentication, Firestore, FCM)
- **認証**: Google Sign-In (Gmail前提)
- **デプロイ**: Vercel/Netlify (PWA最適化)
- **動作モード**: Kiosk モード (Webアプリをフルスクリーン起動)

## 2. 主要機能

### 2.1 Google Todo 連携

- Google Todo リストとの同期
- Todo リストの内容を本体ディスプレイに表示
- 本体からタスクの確認・完了操作が可能

### 2.2 一般タスク管理機能

- タスクリスト: フィルタ (未完了/カテゴリ/優先度)、ソート (期限/優先度)
- 検索、リマインダー (FCMプッシュ通知)
- サブタスク
- オフライン同期 (Firestore offline + Service Worker)

### 2.3 UI/UX (MasterCSS)

- ホーム: ダッシュボード (今日のタスク、完了率)
- テーマ: ダーク/ライト、色分け (優先度: 緑/黄/赤)
- インテリアとしての外観にマッチした見た目
- レスポンシブ: ディスプレイサイズ最適化

## 3. データモデル (Firestore)

```
tasks/{taskId}
├── userId: string (Google UID)
├── title: string
├── description: string
├── priority: string ('low'|'medium'|'high')
├── category: string
├── dueDate: timestamp
├── status: string ('pending'|'in_progress'|'completed'|'archived')
├── subtasks: array<{text: string, checked: bool}>
├── createdAt: timestamp
└── updatedAt: timestamp
```

## 4. 技術スタック詳細

### 4.1 Frontend

```
Svelte 5 + Vite
├── MasterCSS (@mastercss/vite)
├── Firebase SDK (modular v9+)
├── PWA: vite-plugin-pwa
├── State: Svelte Stores + Firebase Realtime
└── UI: Skeleton + Heroicons
```

### 4.2 PWA要件

```
manifest.json:
- name: "STACKS"
- icons: 192x192, 512x512
- theme_color: #3B82F6
- display: standalone

Service Worker:
- キャッシュ: 静的アセット、APIレスポンス
- バックグラウンド同期: FCM + Firestore更新
- プッシュ通知: タスク期限リマインダー
```

### 4.3 プロジェクト構造

```
src/
├── lib/
│ ├── firebase.js (初期化、認証)
│ └── stores.js (タスクストア)
├── routes/
│ ├── +layout.svelte (認証ガード)
│ └── +page.svelte (ダッシュボード)
└── app.html (PWA meta)
```

## 5. ユーザーストーリー

1. PWAインストール → オフラインでもタスクリスト閲覧
2. Google Todo 連携 → タスクがディスプレイに同期表示
3. 本体操作でタスク確認・完了
4. バックグラウンドで通知 → 期限到来時にプッシュ

## 6. 制約&ブラウザ対応

- **オフライン**: Service Worker + Firestore offline persistence
- **Kiosk モード**: Chrome をフルスクリーンで起動

## 7. 開発フェーズ

```
Phase 1 (MVP): 認証 + Firestore CRUD + MasterCSSレイアウト
Phase 2: Google Todo API 連携 + PWA (Service Worker)
Phase 3: FCM通知 + オフライン同期 + アニメーション
Phase 4: 本体設計 (3Dプリンター) + ディスプレイ組み込み + デプロイ
```
