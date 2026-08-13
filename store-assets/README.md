# Store Assets

このディレクトリには、Chrome Web Store / Edge Add-ons の登録時に必要な画像と説明用の素材を配置します。

## 配置例

```text
store-assets/
├── README.md
├── tile.png             # 440x280px, Web Store listing tile
├── promotional.png      # 1400x560px, promotional banner (optional)
├── screenshots/
│   ├── screenshot1.png  # 1280x800px or 640x400px
│   ├── screenshot2.png
│   └── screenshot3.png
└── icons/              # 必要に応じてアイコンを別管理する場合
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

補足:
- 画像は PNG 形式を推奨
- このリポジトリでは、既存の `icon16.png` / `icon32.png` / `icon48.png` / `icon128.png` がルート直下に配置されているため、ストア登録時はそれをそのまま使用してもよい
- ストアの一覧表示に使う `tile.png` と `promotional.png` は、`store-assets/` 配下に置くのが管理しやすい
- 実際のスクリーンショットは `store-assets/screenshots/` に格納する

## ストア登録に必要な入力内容

### 1. 拡張機能名
- `ADO to GitHub Redirector`

### 2. 短い説明（Short description）
- `Redirect Azure DevOps repository URLs to corresponding GitHub repositories`

### 3. 詳細説明（Detailed description）
```text
ADO to GitHub Redirector helps teams redirect Azure DevOps repository URLs to the matching GitHub repositories after migration.

When an organization moves from Azure DevOps Repos to GitHub, old ADO URLs may become disabled or inaccessible. This extension detects Azure DevOps repository URLs and automatically redirects users to the correct GitHub repository.

Features:
- Automatically detects Azure DevOps repository and pull request URLs
- Redirects to the corresponding GitHub repository
- Supports closed PR search for migrated pull requests
- Displays banner notifications for disabled repositories
- Allows configuration of Azure DevOps and GitHub organization names
- Supports exclude keywords for renamed repositories

This extension is useful for migration projects and internal GitHub adoption workflows.
```

### 4. 種別（Category）
- `Productivity`

### 5. 対象ブラウザ
- Chrome Web Store: Chrome
- Edge Add-ons: Microsoft Edge

### 6. キーワード
- `azure devops`
- `github`
- `redirect`
- `repository migration`
- `productivity`
- `devops`

### 7. 開発者情報
- Developer name: `ADO to GitHub Redirector` または組織名
- Support email: サポート用メールアドレス
- Website URL: GitHub リポジトリ URL
- Privacy policy URL: 可能であれば公開 URL を設定

### 8. 画像
- `icon16.png` / `icon32.png` / `icon48.png` / `icon128.png`
- `tile.png` (440x280px)
- `promotional.png` (1400x560px)
- `screenshots/screenshot1.png` (1280x800px もしくは 640x400px)
- 追加スクリーンショット: `screenshot2.png`, `screenshot3.png`（任意）

### 9. スクリーンショットの見せ方
- Azure DevOps の URL であることが分かる画面
- バナー通知やリダイレクトの挿入結果が見える画面
- GitHub リポジトリに遷移する流れが伝わる画面

## 推奨入力テンプレート

```text
Name: ADO to GitHub Redirector
Short description: Redirect Azure DevOps repository URLs to corresponding GitHub repositories
Category: Productivity
Website: https://github.com/<owner>/<repo>
Support: https://github.com/<owner>/<repo>/issues
Privacy policy: https://github.com/<owner>/<repo>/blob/main/README.md
Developer email: your-email@example.com
Keywords: azure devops, github, redirect, repository migration, productivity
```

## 注意事項

1. 画像ファイルは PNG を使用する
2. 透明背景のアイコンを推奨する
3. 関連する UI のスクリーンショットを実際の動作に合わせて準備する
4. 説明文には、対象ユーザーが「何を改善できるか」が伝わるように書く
5. Chrome Web Store と Edge Add-ons は公開要件が少し異なるため、登録前に各ストアのガイドラインを確認する
