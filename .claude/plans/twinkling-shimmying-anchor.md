# 和レトロデザイン変更計画

## 概要
タスク管理アプリのUIを「和レトロ」デザインに変更し、テキストを日本語化する。

## カラーパレット（CSS変数）

```css
:root {
  /* 基本色 */
  --wa-background: #f5f1eb;      /* 生成り - 背景 */
  --wa-foreground: #2c2c2c;      /* 墨色 - 文字 */

  /* プライマリ（群青系） */
  --wa-primary: #223a70;         /* 群青 */
  --wa-primary-light: #3a5a9c;   /* 薄群青 */

  /* セカンダリ（臙脂系） */
  --wa-secondary: #9b3a3a;       /* 臙脂 */

  /* 状態色 */
  --wa-todo: #8b8b7a;            /* 利休鼠 - 未着手 */
  --wa-doing: #2f5d50;           /* 松葉色 - 進行中 */
  --wa-done: #5c6f3d;            /* 苔色 - 完了 */

  /* 中間色 */
  --wa-surface: #fffef8;         /* 象牙色 - カード */
  --wa-surface-alt: #f0ebe3;     /* 薄香色 */
  --wa-border: #c4b8a8;          /* 亜麻色 */
  --wa-border-dark: #8b7e6e;     /* 鳶色 */

  /* テキスト */
  --wa-text-primary: #2c2c2c;
  --wa-text-secondary: #5a5a5a;
  --wa-text-muted: #8a8a8a;
}
```

## 日本語化対応表

| 英語 | 日本語 |
|------|--------|
| Task Manager | 帳簿 |
| Kanban | 看板 |
| Daily | 日次 |
| Weekly | 週次 |
| Archive | 保管庫 |
| Logout | 退出 |
| Todo | 未着手 |
| Doing | 進行中 |
| Done | 完了 |
| Password | 合言葉 |
| Login | 入場 |
| Add | 追加 |
| Delete | 削除 |
| Cancel | 取消 |

## フォント

Google Fontsの「Shippori Mincho」（しっぽり明朝）を使用。

## 変更対象ファイル（16ファイル）

### Phase 1: 基盤
1. `src/app/globals.css` - CSS変数定義
2. `src/app/layout.tsx` - フォント設定、lang="ja"

### Phase 2: ヘッダー
3. `src/components/Header.tsx` - ナビ日本語化・色変更

### Phase 3: カンバン
4. `src/components/KanbanBoard.tsx` - カラム名日本語化
5. `src/components/KanbanColumn.tsx` - 状態色・テキスト
6. `src/components/TaskCard.tsx` - カード色・期限表示

### Phase 4: モーダル
7. `src/components/TaskModal.tsx` - 全面日本語化
8. `src/components/AddTaskModal.tsx` - 日本語化

### Phase 5: ビュー
9. `src/components/DailyView.tsx` - 日本語化
10. `src/components/WeeklyView.tsx` - 日本語化（date-fns locale: ja）
11. `src/components/ArchiveView.tsx` - 日本語化

### Phase 6: ページ
12. `src/app/page.tsx` - タイトル「看板」
13. `src/app/daily/page.tsx` - タイトル「日次振り返り」
14. `src/app/weekly/page.tsx` - タイトル「週次振り返り」
15. `src/app/archive/page.tsx` - タイトル「保管庫」

### Phase 7: ログイン
16. `src/app/(auth)/login/page.tsx` - 日本語化

## 検証方法

1. `pnpm dev` でローカル起動
2. 各ページの表示確認
   - `/login` - ログイン画面
   - `/` - 看板（カンバン）
   - `/daily` - 日次振り返り
   - `/weekly` - 週次振り返り
   - `/archive` - 保管庫
3. タスク追加・編集・ドラッグ&ドロップの動作確認
4. 作業ログ追加・削除の動作確認
5. `pnpm build` でビルド成功確認
6. `vercel --prod` で本番デプロイ・動作確認
