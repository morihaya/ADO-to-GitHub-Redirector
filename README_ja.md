# ADO to GitHub Redirector

無効化されたAzure DevOps RepositoriesからGitHubの対応するリポジトリへのシームレスなリダイレクトを支援するChrome/Edgeブラウザ拡張機能です。

## 🚀 概要

組織がAzure DevOps ReposからGitHubに移行する際、古いAzure DevOpsのURLは無効化されたりアクセスできなくなったりして、ユーザーはリポジトリがどこに移動したのかわからなくなることがあります。この拡張機能は、対応するGitHubリポジトリへの自動リダイレクトを提供することで、この問題を解決します。

## ✨ 機能

- **自動検出**: Azure DevOpsリポジトリのURLにアクセスしていることを自動で検出
- **スマートリダイレクト**: 対応するGitHubリポジトリにリダイレクト
- **プルリクエスト対応**: プルリクエストのURLを特別に処理し、GitHubのクローズされたPR検索にリダイレクト（移行されたPRは通常クローズされているため）
- **視覚的通知**: 無効化されたリポジトリを検出した際にバナー通知を表示
- **ワンクリックリダイレクト**: 設定済みの組織では拡張機能アイコンのクリックで即座にリダイレクト
- **組織名設定可能**: カスタムのAzure DevOpsとGitHub組織名を設定可能

## 📋 前提条件

- ChromeまたはMicrosoft Edgeブラウザ
- 組織のAzure DevOpsとGitHub組織名の基本的な知識

## 🔧 インストール

### 手動インストール（開発版）

1. このリポジトリをローカルマシンにクローンまたはダウンロード
2. ChromeまたはEdgeを開き、拡張機能のページに移動：
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
3. 「デベロッパーモード」を有効化（右上のトグル）
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、拡張機能フォルダを選択
5. 拡張機能がブラウザのツールバーに表示されます

## ⚙️ 設定

### 初期設定

1. ブラウザツールバーの拡張機能アイコンをクリック
2. 組織の詳細を入力：
   - **Azure DevOps Organization**: ADO組織名（例：`mycompany`）
   - **GitHub Organization**: GitHub組織名（例：`mycompany-github`）
3. 「Save Settings」をクリック

### 設定例

```
Azure DevOps Organization: contoso
GitHub Organization: contoso-github
```

これにより、以下のようなURLがリダイレクトされます：
- `https://dev.azure.com/contoso/MyProject/_git/MyRepo` → `https://github.com/contoso-github/MyProject-MyRepo`

## 🎯 動作原理

### URLマッピング

拡張機能は以下のマッピングパターンに従います：

| Azure DevOps URL | GitHub URL |
|-------------------|------------|
| `https://dev.azure.com/{ADO_ORG}/{PROJECT}/_git/{REPO}` | `https://github.com/{GITHUB_ORG}/{PROJECT}-{REPO}` |
| `https://dev.azure.com/{ADO_ORG}/{PROJECT}/_git/{REPO}/pullrequest/{ID}` | `https://github.com/{GITHUB_ORG}/{PROJECT}-{REPO}/pulls?q=is%3Aclosed+is%3Apr` |

### プルリクエストの処理

プルリクエストのURLについては、GitHubのクローズされたプルリクエスト検索にリダイレクトします。理由：
- 移行されたプルリクエストは通常、新しいリポジトリでクローズされている
- 対応するGitHub PRを見つける最良の方法を提供
- 検索にはプロジェクト名とリポジトリ名の両方が含まれ、精度を向上

## 🔍 使用例

### 基本的なリポジトリリダイレクト

**変更前**: `https://dev.azure.com/mycompany/WebApp/_git/Frontend`
**変更後**: `https://github.com/mycompany-github/WebApp-Frontend`

### プルリクエストリダイレクト

**変更前**: `https://dev.azure.com/mycompany/WebApp/_git/Frontend/pullrequest/12345`
**変更後**: `https://github.com/mycompany-github/WebApp-Frontend/pulls?q=is%3Aclosed+is%3Apr`

## 🎨 視覚的機能

### バナー通知

拡張機能が無効化されたリポジトリを検出すると、ページ上部に青いバナーを表示：
- リポジトリの状況についての明確なメッセージ
- 直接の「Redirect to GitHub」ボタン
- 10秒後に自動で消去

### 拡張機能アイコン

- Azure DevOpsリポジトリのURLにいる際に視覚的フィードバックを表示
- （設定済みの場合）クリックで即座にリダイレクト
- 明確なホバーツールチップを提供

## 🛠️ 技術詳細

### アーキテクチャ

- **Manifest Version**: 3（最新のChrome拡張機能標準）
- **Permissions**: `storage`, `activeTab`, `tabs`
- **Host Permissions**: `dev.azure.com/*`, `github.com/*`

### ファイル構造

```
├── manifest.json          # 拡張機能設定
├── popup.html             # 設定UI
├── popup.js               # 設定管理とリダイレクトロジック
├── content.js             # ページコンテンツ分析と通知
├── background.js          # URL監視とリダイレクト
├── icon16.png             # 拡張機能アイコン (16x16)
├── icon32.png             # 拡張機能アイコン (32x32)
├── icon48.png             # 拡張機能アイコン (48x48)
└── icon128.png            # 拡張機能アイコン (128x128)
```

### 対応環境

- ✅ Google Chrome（Manifest V3）
- ✅ Microsoft Edge（Chromiumベース）
- ✅ クロスプラットフォーム（Windows、macOS、Linux）

## 🔒 プライバシーとセキュリティ

- **データ収集なし**: 拡張機能は個人データを収集または送信しません
- **ローカル保存のみ**: すべての設定はブラウザにローカルで保存
- **最小限の権限**: コア機能に必要な権限のみを要求
- **オープンソース**: すべてのコードはレビュー可能

## 🐛 トラブルシューティング

### 拡張機能が動作しない場合

1. **設定確認**: 両方の組織名が正しく設定されていることを確認
2. **拡張機能リロード**: 拡張機能を無効化して再有効化
3. **URLパターン確認**: Azure DevOpsのURLに`/_git/`が含まれていることを確認
4. **ブラウザコンソール**: 開発者ツールでエラーメッセージを確認

### よくある問題

| 問題 | 解決方法 |
|-------|----------|
| 間違ったGitHub組織にリダイレクトされる | 設定のGitHub組織名を再確認 |
| 拡張機能がADO URLを検出しない | URLに`dev.azure.com`と`/_git/`が含まれていることを確認 |
| バナーが表示されない | 拡張機能インストール後にページをリフレッシュ |

## 🤝 貢献

貢献を歓迎します！問題報告、機能要求、プルリクエストをお気軽に提出してください。

### 開発環境のセットアップ

1. リポジトリをクローン
2. 変更を加える
3. デベロッパーモードでブラウザでテスト
4. プルリクエストを提出

## 📄 ライセンス

このプロジェクトはオープンソースで、MITライセンスの下で利用可能です。

## 🙏 謝辞

- Azure DevOpsからGitHubへの移行をサポートする必要性にインスパイア
- GitHubへの移行を行うすべての組織に感謝
- 信頼性のために最新のChrome Extension APIで構築

---

**注意**: この拡張機能はAzure DevOpsからGitHubへの移行を支援するために設計されています。元のAzure DevOpsリポジトリとターゲットのGitHubリポジトリの両方にアクセスする必要な権限があることを確認してください。