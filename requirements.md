# STACKS 要件定義書

## 1. プロダクト概要

- **プロダクト名**: STACKS
- **キャッチコピー**: 忙しさを、美しく
- **目的**: 溜まったタスクの解消をより楽しく・簡単にするインテリア型タスク管理デバイス
- **ターゲット**: 日常タスク管理を楽しくしたい個人ユーザー（学生/ビジネスパーソン）
- **販売形態**: 完成品として販売。エンドユーザーはデバイス本体を受け取り、キーボードなし・設定ファイル編集なしで初期セットアップを完了できることが必須要件

---

## 2. ハードウェア構成

### 2.1 本体

| 項目 | 仕様 |
|---|---|
| コンピュータ | Raspberry Pi 5 |
| OS | Raspberry Pi OS |
| ディスプレイ | 円形 720×720px |
| ブラウザ | Chromium（キオスクモード） |
| 給電 | USB Type-C |
| 筐体 | Fusion 360 設計 + 3D プリンター出力 |

### 2.2 入力機構

- **回転する外枠**：磁気角度センサーで回転量を取得
  - ページ移動（`/clock` ↔ `/stack` ↔ `/table`）
  - `/stack` での物理演算演出（洗濯機的動き）
  - `/table` でのリストスクロール・決定
- **ボタン**：クリックイベントで確定操作
- キー入力は不要（完全ノンキーボード操作）

### 2.3 サーバー

- Raspberry Pi 上で nginx + adapter-node（Node.js）を起動
- Chromium が `http://localhost` を開くキオスク構成
- 外部ネットワーク（WiFi）経由で Google Tasks API と通信

---

## 3. ソフトウェア構成

### 3.1 フレームワーク

```
SvelteKit 2 + Svelte 5 + Vite
├── MasterCSS (@master/css)
├── GSAP 3（アニメーション）
├── adapter-node（Node.js サーバー）
└── TypeScript 6
```

**PWA・Service Worker は使用しない**（Chromium キオスクで直接起動するため不要）

### 3.2 認証・外部連携

- **Firebase は使用しない**
- **Cloudflare Worker リレー**経由でスマホから Google OAuth 認証
  - Worker が固定 URL（`https://stacks-auth.xxx.workers.dev/callback`）でトークンを受け取る
  - ローカル IP に依存しないため販売・量産に対応
  - 無料枠超過防止のため 300 セッション/日のレートリミットを実装
- セッションはファイル永続化（`.sessions.json`）
  - サーバー再起動後もログイン状態を維持
  - `SESSIONS_FILE` 環境変数でパス変更可能

### 3.3 API 構成

```
SvelteKit API Routes（adapter-node）
├── /auth/login               - OAuth 開始（デバイス本体ブラウザ用・開発時のみ想定）
├── /auth/callback            - コールバック・トークン取得・セッション保存
├── /auth/logout              - セッション削除
├── /auth/qr-complete         - Device Flow 完了後に Cookie をセットしてリダイレクト
├── /api/auth/device/start    - Device Flow 開始（device_code 取得）
├── /api/auth/device/poll     - トークンポーリング（クライアントから定期呼び出し）
├── /api/tasks                - GET: タスク一覧取得
├── /api/tasks/[id]           - PATCH: 完了 / DELETE: 削除
└── /api/rotation             - Raspberry Pi 物理入力（SSE）
```

---

## 4. 初回セットアップ（WiFi 接続）

### 4.1 前提

エンドユーザーはデバイスを購入後、キーボードなし・`.env` 編集なしで WiFi に接続する必要がある。

### 4.2 セットアップフロー

1. デバイス起動 → OS 側で AP（ホットスポット）モードを起動
   - SSID: `STACKS-Setup`（`WIFI_AP_SSID` 環境変数で変更可）
   - パスワード: `stacks1234`（`WIFI_AP_PASSWORD` 環境変数で変更可）
   - IP: `192.168.4.1`（`hostapd` + `dnsmasq` による OS 設定）
2. Settings → WiFi → デバイス AP の QR コードを表示 (`/settings/wifi`)
3. スマホで QR スキャン → `STACKS-Setup` ホットスポットに接続
4. スマホブラウザで `http://192.168.4.1/setup` を開く
5. 家の WiFi の SSID とパスワードを入力して送信
6. `/api/setup/wifi` が `nmcli dev wifi connect` を実行
7. デバイスが家の WiFi に接続完了

### 4.3 実装範囲

| 担当 | 内容 |
|---|---|
| **SvelteKit（このリポジトリ）** | AP QR 表示 (`/settings/wifi`)、セットアップ UI (`/setup`)、WiFi 適用 API (`/api/setup/wifi`) |
| **OS 設定（別途）** | `hostapd` + `dnsmasq` による AP モード起動、`NetworkManager` / `nmcli` の導入 |

### 4.4 UI 設計上の注意

- `/setup` ページはスマホブラウザで表示される。`position: fixed; inset: 0` でルートレイアウトの 720×720 円を覆い、全画面表示する
- `/settings/wifi` ページは 720×720 デバイス画面用（通常のレイアウト内）

---

## 5. Google Tasks 連携

### 5.1 セットアップフロー（初回のみ）

デバイスへのキー入力なし、QR コード + Device Flow 設計：

1. Settings ページで「QR でログイン」を選択
2. デバイスが Google から `device_code` を取得し QR コードとコード文字列を表示
3. スマホで QR スキャン（または `google.com/device` に手動アクセス）
4. スマホ側で Google アカウントを選択・承認
5. デバイス側がポーリングでトークン取得 → セッション確立・自動運用開始

**ポイント**: redirect URI が不要なため、ローカル IP やネットワーク構成に依存しない。量産・販売に対応。

### 5.2 同期戦略

- **ポーリング方式**（Google Tasks API にプッシュ通知がないため）
- アダプティブポーリング（操作中: 15秒 / アイドル: 5分）
- `updatedMin` パラメータで差分のみ取得（通信量削減）
- サーバー再起動時もセッションはファイルから復元

### 5.3 クォータ

- Google Tasks API: 50,000リクエスト/日/ユーザー
- 1台・1ユーザー運用では問題なし（15秒ポーリングでも最大5,760/日）

### 5.4 フィールドマッピング

| LocalTask | Google Tasks API |
|---|---|
| `id` | `id` |
| `title` | `title` |
| `description` | `notes` |
| `dueDate` | `due`（RFC 3339） |
| `status: 'pending'` | `status: 'needsAction'` |
| `status: 'completed'` | `status: 'completed'` |
| `priority`, `category`, `subtasks` | ローカルのみ（API 対応なし） |

---

## 6. ページ構成

| ルート | 対象 | 内容 |
|---|---|---|
| `/clock` | デバイス | アナログ時計 + ポモドーロタイマー + 残りタスク数 |
| `/stack` | デバイス | タスクをボールとして物理演算で可視化（期限・優先度で色変化） |
| `/table` | デバイス | タスク一覧。スワイプ右で完了、スワイプ左で削除 |
| `/settings` | デバイス | 言語設定・Google 認証・WiFi QR・隠し設定エディタ |
| `/settings/wifi` | デバイス | デバイス AP の QR コード表示 |
| `/settings/qr` | デバイス | Google Login QR コード表示 |
| `/setup` | **スマホ** | WiFi 初期設定フォーム（全画面・スマホブラウザ向け） |

---

## 7. UI・表示制約

- **固定解像度**: 720×720px（円形ディスプレイ）
- **タッチ操作なし**: `touch-action: none`（物理ノブで操作）
- **カーソル非表示**: キオスクモード
- **ダークテーマ**: デフォルト（インテリアとしての外観）
- **例外 (`/setup`)**: スマホブラウザ向けのため `position: fixed; inset: 0` で全画面表示

---

## 8. 環境変数

> すべて製造・デプロイ時に設定。エンドユーザーは編集しない。

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STACKS_WORKER_URL=https://stacks-auth.xxx.workers.dev   # Cloudflare Worker URL
STACKS_WORKER_SECRET=                                   # Worker との共有シークレット
SESSIONS_FILE=/home/pi/stacks/.sessions.json            # 本番（任意）
VITE_IS_PHYSICS=true       # 物理ノブ入力の有効化
VITE_CURSOR_VISIBLE=false  # キオスクモードでカーソル非表示
WIFI_AP_SSID=STACKS-Setup  # デバイス自身のホットスポット SSID（省略時: STACKS-Setup）
WIFI_AP_PASSWORD=stacks1234  # デバイス自身のホットスポットパスワード（省略時: stacks1234）
```

Worker 側のシークレット（`npm run worker:secret` で設定）:
```
GOOGLE_CLIENT_ID     # SvelteKit と同じ値
GOOGLE_CLIENT_SECRET # SvelteKit と同じ値
WORKER_SECRET        # SvelteKit の STACKS_WORKER_SECRET と同じ値
```

---

## 9. 開発フェーズ

```
Phase 1（完了）: ローカルタスク管理・UI・物理入力
Phase 2（完了）: Google OAuth 2.0 + Google Tasks API 連携・セッション永続化
Phase 3（完了）: OAuth Device Flow によるスマホ QR ログイン（量産対応）
Phase 4（完了）: WiFi 初期設定フロー（AP モード QR + スマホ設定 UI）
Phase 5（進行中）: アダプティブポーリング・差分同期
Phase 6: 筐体設計（3D プリンター）・ディスプレイ組み込み・本番デプロイ
```
