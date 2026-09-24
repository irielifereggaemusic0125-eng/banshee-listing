# Banshee 出品文ジェネレーター v1

商品写真を撮るだけで、販路別（メルカリ／ラクマ／Yahoo!フリマ／ヤフオク／eBay）の出品タイトルと説明文を作るWebアプリです。
iPhone（Safari・ホーム画面に追加）とMac（Chrome / Safari）で同じURLを使います。

v1のスコープは **撮影 → 解析 → 販路別テキスト生成 → コピー** まで。スプレッドシート連携はv2です。

---

## 1. ファイル構成

```
banshee-listing/
├── index.html            アプリ本体（HTML/CSS/JSを1ファイルに収めています）
├── manifest.webmanifest  ホーム画面追加用
├── sw.js                 オフラインでUIだけ開けるようにする最小のService Worker
├── icon-192.png / icon-512.png
└── README.md
```

フレームワークなし・ビルドなし・外部ライブラリなし。**APIキーはコードに一切含まれていません。**

---

## 2. デプロイ手順（GitHub Pages）

HTTPSでないとiPhoneのカメラ・クリップボード・ホーム画面追加が正しく動かないため、GitHub Pagesに置きます。

```bash
cd ~/Downloads/Banshee/banshee-listing
git init
git add .
git commit -m "Banshee listing generator v1"
gh repo create banshee-listing --public --source=. --push
```

続けてGitHub Pagesを有効にします。

```bash
gh api -X POST repos/:owner/banshee-listing/pages -f source[branch]=main -f source[path]=/
```

または画面から：リポジトリの **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**。

1〜2分後に次のURLで開きます。

```
https://<あなたのGitHubユーザー名>.github.io/banshee-listing/
```

更新するときは `git add -A && git commit -m "update" && git push` だけです。

> privateリポジトリでもPagesを使えるのはGitHub Pro以上のプランです。無料プランの場合はpublicにしてください。APIキーはコードに含まれていないので、publicでも鍵は漏れません。

---

## 3. Gemini APIキーの取得と制限のかけ方

### 3-1. キーを作る

1. https://aistudio.google.com/apikey を開く
2. 「APIキーを作成」→ プロジェクトを選ぶ
3. 表示された `AIza...` をコピー

### 3-2. 🔒 HTTPリファラ制限を必ずかける（重要）

キーはブラウザから直接使うため、**制限をかけないと第三者に使われます。**

1. https://console.cloud.google.com/apis/credentials を開く
2. 対象のAPIキーを開く
3. **アプリケーションの制限** → 「ウェブサイト」を選択
4. 「ウェブサイトの制限」に次の2つを追加
   ```
   https://<あなたのGitHubユーザー名>.github.io/*
   http://localhost:*
   ```
   （2つ目はMacでのローカル確認用。不要なら省略可）
5. **APIの制限** → 「キーを制限」→ `Generative Language API` だけにチェック
6. 保存（反映に数分かかることがあります）

### 3-3. アプリに入れる

アプリ右上の **⚙ → Gemini APIキー** に貼り付けて「保存」。
キーは **その端末のlocalStorageにだけ** 保存されます。iPhoneとMacでそれぞれ1回入力してください。

設定は **⚙ → 書き出し** でJSONに出せます。別端末で **読み込み** すれば移せます（このJSONにはAPIキーが入ります。取り扱いに注意）。

---

## 4. iPhoneのホーム画面に追加する

1. Safariで `https://<ユーザー名>.github.io/banshee-listing/` を開く
2. 下部の共有ボタン（□に↑）をタップ
3. 「ホーム画面に追加」→ 名前は「Banshee出品」→ 追加
4. ホーム画面のアイコンから起動（アドレスバーなしのアプリ表示になります）
5. 初回だけ ⚙ からAPIキーを入れる

> Chromeではなく **Safari** で追加してください（iOSではSafariだけがホーム画面追加に対応）。

---

## 5. 使い方

1. **写真**：最大6枚。1枚目がメインです。`◀ ▶` で並べ替え、`✕` で削除。送信前に長辺1600px・JPEG品質0.85へ自動縮小します。
2. **カテゴリ**：初期値は「自動判定」。指定するとAIの判定より優先されます。
3. **補足情報**：AIが写真から読めない情報（実寸、付属品、状態メモなど）を補います。**補足は写真より優先**されます。仕入れ値は出品文には使わず、「登録用データをコピー」にだけ使います。
4. **生成**：Geminiを1回だけ呼びます。解析中は中止できます。
5. **出力タブ**
   - メルカリ：タイトル3案（40字）＋説明文（1000字）。ラクマ・Yahoo!フリマも同じ文面で使えます。
   - ヤフオク：タイトル3案（65字）＋説明文（冒頭挨拶がヤフオク向け・ハッシュタグなし）
   - eBay：Title 3案（80字）＋Item Specifics（行ごとコピー可）＋Description
   - 要確認：AIが判断できなかった項目、断定語・絵文字・シリアル番号の警告
6. **テンプレA/B**：バッグ・革小物／アクセサリー・シルバー／時計は **A**（Bansheeについての欄あり）、アパレル・その他は **B**。出力画面のボタンで手動切替できます。
7. **履歴**：直近50件を端末内に保存。タップで出力を復元します。

### 文字数オーバー時の自動調整（メルカリ1000字）

超えた場合、次の順に自動で削ります。固定ハッシュタグは残します。

1. ハッシュタグを後ろから減らす
2. ランク基準の注記行を削る
3. 商品説明の段落を末尾の文から削る

それでも超える場合は赤字で警告するので、手で調整してください。

---

## 6. 真贋・コンプライアンスの扱い

- 「本物」「正規品」「鑑定済み」「保証」などの**断定語はAIに書かせません**。もし混入したら要確認タブに警告が出ます（自動削除はしません）。
- 絵文字は禁止。使ってよい記号は `(^^) ☆ ♪` のみ。混入したら警告します。
- シリアル番号らしき文字列（数字を含む英数字8桁以上）が本文に入ると警告します。**シリアルは説明文に書きません。**
- 古物商許可番号は `愛知県公安委員会 第542652509100号` を固定で出力します。

> 旧Chrome拡張とメモリの旧テンプレには「すべて正規品を取り扱っております」「100% Authentic」「#正規品」が入っていましたが、本アプリでは方針に従い**引き継いでいません**。

---

## 7. ローカルで動かす（Mac・任意）

```bash
cd ~/Downloads/Banshee/banshee-listing
python3 -m http.server 8123
```

`http://localhost:8123/` を開きます。`file://` で直接開くとService Workerが動きません。

---

## 8. 既知の制限

- MacのChromeはHEICを読めません。iPhoneから直接AirDropしたHEICを選ぶと「JPEGに変換してから選んでください」と表示します（iPhoneのSafariで選ぶ場合は自動でJPEGになるため問題ありません）。
- eBayのItem Specificsの `Department` は写真から判断できないため空欄です。出品時に手で選んでください。
- 履歴はブラウザのlocalStorageです。iPhoneとMacで共有されません。プライベートブラウズや履歴消去で消えます。

---

## 9. v2でやること

- Google Apps Script Web App経由で管理表へ書き込み（C=ステータス「出品準備中」、D=商品名、H=仕入れ値）
- 別シート「出品文」へ 行ID / 販路 / タイトル / 本文 / 生成日時 を保存
- 「登録用データをコピー」のTSV列順を管理表の列に合わせて見直し
