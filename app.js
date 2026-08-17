// Monaco Editor の CDN 設定
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});

let editor;

// 仕様書に基づく関数データベース
const COMMAND_DATABASE = {
  "sc_if": {
    detail: "sc_if <条件式> <true時行番号> <false時行番号>",
    doc: "条件分岐を行います。\n- 第一引数: 条件式（変数、配列/辞書アクセス、true/false、数値、比較演算子==,!=,>=,<=,>,<）\n- 第二引数: 条件式がtrueのときに実行する行番号(1-based)\n- 第三引数: 条件式がfalseのときに実行する行番号(1-based)\n- return: [2, result ? trueLine : falseLine]",
    snippet: "sc_if ${1:condition} ${2:trueLine} ${3:falseLine}"
  },
  "jumpto": {
    detail: "jumpto <行番号>",
    doc: "指定した行番号にジャンプします。\n- 第一引数: 次に実行する行番号(1-based)\n- return: [2, Number(args[0]) - 1]",
    snippet: "jumpto ${1:lineNum}"
  },
  "setvar": {
    detail: "setvar <do_next> <変数名> <代入値>",
    doc: "変数に値を代入・設定します。\n- 第一引数: do_nextフラグ[0/1]\n- 第二引数: 設定する変数名(変数名、配列/辞書アクセス)\n- 第三引数: 代入する値(\"文字列\"、数値、配列[]、辞書{}、変数名等)\n- return: [11, null] / [10, null]",
    snippet: "setvar ${1:do_next} ${2:varName} ${3:value}"
  },
  "sc_calc": {
    detail: "sc_calc <do_next> <変数> <演算子> <値/変数>",
    doc: "変数の計算を行います。\n- 第一引数: do_nextフラグ[0/1]\n- 第二引数: 計算に使う変数\n- 第三引数: 演算子 (+, -, *, /, %, ^)\n- 第四引数: 計算に使う変数または値等\n- return: [11, null] / [10, null]",
    snippet: "sc_calc ${1:do_next} ${2:varName} ${3:op} ${4:value}"
  },
  "dialogue": {
    detail: "【非推薦】dialogue <内容> <normal/html> <内部キャラ名> <表示キャラ名> <補助オプション>",
    doc: "⚠️ **注意**: テスト用関数です。`disp_text` へ統合されたため利用時には警告が出ます。\n- return: [0, null]",
    snippet: "dialogue ${1:content} ${2:type} ${3:charaId} ${4:dispName} ${5:opt}",
    deprecated: true
  },
  "debug_dispvar": {
    detail: "【非推薦】debug_dispvar <表示変数パス> <内容消去[0/1]> <do_next>",
    doc: "⚠️ **注意**: テスト用関数です。`disp_text` へ統合されたため利用時には警告が出ます。\n- return: [1, null] / [0, null]",
    snippet: "debug_dispvar ${1:varPath} ${2:clearFlag} ${3:do_next}",
    deprecated: true
  },
  "dispIMG": {
    detail: "dispIMG <do_next> <表示先> <表示フラグ> <画像パス> <フェード有無> <フェード時間> [画像要素id]",
    doc: "画像を画面に表示します。\n- 第一引数: do_next[0/1]\n- 第二引数: 表示先 (bg, chara, back, front, 任意id)\n- 第三引数: 表示フラグ[1/0]\n- 第四引数: 画像パス(ASSETS.imgs/svg内、非表示時None可)\n- 第五引数: フェード有無[1/0]\n- 第六引数: フェード時間[s]\n- 第七引数: 画像要素id(省略可)\n- return: [1, null] / [0, null]",
    snippet: "dispIMG ${1:do_next} ${2:target} ${3:dispFlag} ${4:imgPath} ${5:fade} ${6:duration} ${7:imgId}"
  },
  "statusIMG": {
    detail: "statusIMG <do_next> <対象id> <状態設定オブジェクト>",
    doc: "表示中画像の位置・拡大率・フィルター等の状態を変更します。\n- 第一引数: do_next[0/1]\n- 第二引数: 対象id (bg, chara, back, front, 任意id)\n- 第三引数: 状態設定 ({position, size, x, y, rotate, scale, opacity, duration等})\n- return: [1, null] / [0, null]",
    snippet: "statusIMG ${1:do_next} ${2:targetId} ${3:settingsJson}"
  },
  "sympleBGchange": {
    detail: "【非推薦】sympleBGchange <画像パス> <表示[0/1]> <消去[0/1]> <do_next>",
    doc: "⚠️ **注意**: テスト用関数です。`dispIMG` へ統合されたため利用時には警告が出ます。\n- return: [1, null] / [0, null]",
    snippet: "sympleBGchange ${1:imgPath} ${2:show} ${3:hide} ${4:do_next}",
    deprecated: true
  },
  "console_dispvar": {
    detail: "【非推薦】console_dispvar <変数パス> <do_next>",
    doc: "⚠️ **注意**: テスト用関数です。`disp_text` へ統合されたため利用時には警告が出ます。\n- return: [1, null] / [0, null]",
    snippet: "console_dispvar ${1:varPath} ${2:do_next}",
    deprecated: true
  },
  "clear_scline_counter": {
    detail: "clear_scline_counter",
    doc: "無限ループ防止用の行実行カウンターをリセットします。\n- 引数なし\n- return: [1, null]",
    snippet: "clear_scline_counter"
  },
  "release_arasuzi": {
    detail: "release_arasuzi <do_next> <あらすじ番号>",
    doc: "指定した番号のあらすじを解放します。\n- 第一引数: do_next[0/1]\n- 第二引数: 解放するあらすじ番号\n- return: [41, 番号] / [40, 番号]",
    snippet: "release_arasuzi ${1:do_next} ${2:arasuziNum}"
  },
  "disp_text": {
    detail: "disp_text <do_next> <表示場所> <表示内容> <スタイル/キャラid> <表示名> <設定オブジェクト> [セリフ欄空欄化]",
    doc: "テキスト（台詞やコンソールメッセージ）を表示します。\n- 第一引数: do_next[0/1]\n- 第二引数: 表示場所 (dialogue, console, 任意id)\n- 第三引数: 表示内容 (${変数パス}使用可, ルビ/HTMLタグ可)\n- 第四引数: スタイル名 / キャラid (ペン色参照用)\n- 第五引数: 表示名 (None可, <漢字:ルビ>表記可)\n- 第六引数: スタイル・フェード・話者暗転等の設定オブジェクト {}\n- 第七引数: 任意id表示時にセリフ欄を空にするか[1/0]\n- return: dialogue時[30/31, [第四引数, 第五引数]], その他[0/1, null]",
    snippet: "disp_text ${1:do_next} ${2:place} ${3:content} ${4:charaId} ${5:dispName} ${6:configJson}"
  },
  "status_text": {
    detail: "status_text <do_next> <対象id> <状態設定オブジェクト>",
    doc: "テキスト要素のスタイル（文字色・拡大・揺れ・透明度等）を変更します。\n- 第一引数: do_next[0/1]\n- 第二引数: 対象id (dialogue, text, name, nameFrame, textFrame, 任意id)\n- 第三引数: 状態設定 ({color, opacity, scale, shake, duration等})\n- return: [1, null] / [0, null]",
    snippet: "status_text ${1:do_next} ${2:targetId} ${3:settingsJson}"
  },
  "effect_screen": {
    detail: "effect_screen <do_next> <エフェクト設定オブジェクト>",
    doc: "画面全体にエフェクト（フェード、フラッシュ、シェイク、フィルター、スライド、ワイプ、クリア）をかけます。\n- 第一引数: do_next[0/1]\n- 第二引数以降: 設定オブジェクト ({type, color, opacity, duration, amount, direction等})\n- return: [1, null] / [0, null]",
    snippet: "effect_screen ${1:do_next} ${2:effectJson}"
  },
  "add_html": {
    detail: "add_html <do_next> <親要素id> <追加位置> <追加HTML>",
    doc: "指定した要素にHTML断片を追加します。\n- 第一引数: do_next[0/1]\n- 第二引数: 追加先の親要素id (dialogue, 任意id)\n- 第三引数: 追加位置 (beforeend, afterbegin, beforebegin, afterend)\n- 第四引数以降: 追加するHTML (空白は\\sを使用可)\n- return: [1, null] / [0, null]",
    snippet: "add_html ${1:do_next} ${2:parentId} ${3:position} ${4:htmlContent}"
  },
  "parallel": {
    detail: "【未実装】parallel <do_next> <行番号/func1> <行番号/func2>",
    doc: "⚠️ **注意**: 現在未実装のコマンドです。",
    snippet: "parallel ${1:do_next} ${2:func1} ${3:func2}"
  },
  "clearvar": {
    detail: "clearvar <do_next> <変数パス> <設定モード[1/2/3]>",
    doc: "変数を消去・初期化します。\n- 第一引数: do_next[0/1]\n- 第二引数: 変数パス\n- 第三引数: 設定 (1:下層をundefinedに, 2:変数自体の削除, 3:最外層のみundefinedに)",
    snippet: "clearvar ${1:do_next} ${2:varPath} ${3:mode}"
  },
  "clear_backlog": {
    detail: "clear_backlog <do_next>",
    doc: "ここまでのバックログ履歴を破棄します。\n- 第一引数: do_next[0/1]\n- return: [51, null] / [50, null]",
    snippet: "clear_backlog ${1:do_next}"
  },
  "-": {
    detail: "- (ダミーコマンド)",
    doc: "行数を調整・埋めるためのダミーコマンドです。\n- 引数なし\n- return: [1, null]",
    snippet: "-"
  },
  "end": {
    detail: "end (シナリオ終了)",
    doc: "シナリオの終了を示します。\n- 引数なし\n- return: [1, null]",
    snippet: "end"
  }
};

require(['vs/editor/editor.main'], function () {

  // 1. 独自言語 'umsc' の登録
  monaco.languages.register({ id: 'umsc' });

// 2. シンタックスハイライト（構文ルール）
  monaco.languages.setMonarchTokensProvider('umsc', {
    // COMMAND_DATABASE のキー配列を keywords として登録
    keywords: Object.keys(COMMAND_DATABASE),

    tokenizer: {
      root: [
        // コメント (; から行末まで)
        [/;.*$/, 'comment'],

        // コマンド名
        [/[a-zA-Z_][a-zA-Z0-9_]*/, {
          cases: {
            '@keywords': 'keyword', // ⭕ '@keywords' で参照する
            '@default': 'identifier'
          }
        }],

        // 特殊ダミーコマンド -
        [/^-$/, 'keyword'],

        // 文字列 (ダブルクォーテーション囲み)
        [/"([^"\\]|\\.)*"/, 'string'],

        // 数値
        [/\b\d+(\.\d+)?\b/, 'number'],

        // JSON / 変数アクセスのブラケット・記号
        [/[{}\[\]()]/, 'delimiter.bracket'],
        [/[:,\.]/, 'delimiter'],

        // 変数埋め込み ${...}
        [/\$\{[^}]+\}/, 'variable']
      ]
    }
  });

  // 3. 自動補完のプロバイダー
  monaco.languages.registerCompletionItemProvider('umsc', {
    provideCompletionItems: function (model, position) {
      const suggestions = Object.keys(COMMAND_DATABASE).map(cmdKey => {
        const cmd = COMMAND_DATABASE[cmdKey];
        return {
          label: cmdKey,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: cmd.snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: cmd.detail,
          documentation: cmd.doc
        };
      });
      return { suggestions: suggestions };
    }
  });

  // 4. ホバー情報のプロバイダー
  monaco.languages.registerHoverProvider('umsc', {
    provideHover: function (model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      // 行頭のコマンド名を取得（ダミー記号 "-" も考慮）
      const lineContent = model.getLineContent(position.lineNumber).trim();
      const firstWord = lineContent.split(/\s+/)[0];

      if (COMMAND_DATABASE[word.word]) {
        const cmd = COMMAND_DATABASE[word.word];
        return {
          contents: [
            { value: `**${cmd.detail}**` },
            { value: cmd.doc }
          ]
        };
      } else if (word.word === '-' || firstWord === '-') {
        const cmd = COMMAND_DATABASE['-'];
        return {
          contents: [
            { value: `**${cmd.detail}**` },
            { value: cmd.doc }
          ]
        };
      }
      return null;
    }
  });

// 5. エラーおよび警告チェック (Diagnostics)
  function validate(model) {
    const markers = [];
    const lines = model.getLinesContent();

    lines.forEach((lineText, index) => {
      const trimmed = lineText.trim();
      const lineNumber = index + 1;

      // ① 空行のチェック
      if (trimmed === '') {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: '空行は使用できません。',
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: lineText.length + 1
        });
        return;
      }

      // ② コメントアウト (;) のチェック
      const commentIndex = lineText.indexOf(';');
      if (commentIndex !== -1) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'コメントアウト (;) は使用できません。',
          startLineNumber: lineNumber,
          startColumn: commentIndex + 1,
          endLineNumber: lineNumber,
          endColumn: lineText.length + 1
        });
      }

      // コメントを除いたコマンド部分の抽出
      const codePart = (commentIndex !== -1 ? lineText.slice(0, commentIndex) : lineText).trim();
      if (codePart === '') return;

      const tokens = codePart.split(/\s+/);
      const command = tokens[0];

      // ③ 未定義コマンドのチェック
      if (!COMMAND_DATABASE[command] && command !== '-') {
        const startCol = lineText.indexOf(command) + 1;
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: `未定義のコマンドです: '${command}'`,
          startLineNumber: lineNumber,
          startColumn: startCol,
          endLineNumber: lineNumber,
          endColumn: startCol + command.length
        });
      }

      // ④ 非推奨・統合済みテスト関数の警告チェック
      if (COMMAND_DATABASE[command] && COMMAND_DATABASE[command].deprecated) {
        const startCol = lineText.indexOf(command) + 1;
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: `非推薦関数です: '${command}' は disp_text または dispIMG へ統合されました。`,
          startLineNumber: lineNumber,
          startColumn: startCol,
          endLineNumber: lineNumber,
          endColumn: startCol + command.length
        });
      }
    });

    monaco.editor.setModelMarkers(model, 'umsc-owner', markers);
  }

  // 6. 初期サンプルコード（空行・コメントなし版）
  const initialSampleCode = `dispIMG 0 bg 1 material/back_image/chemistryclass.jpg 1 1
dispIMG 0 chara 1 material/chara_image/A_Kabura_webp/chara_A01.webp 1 0.5 kabura
setvar 1 doc["count"] 3
sc_if issue34_check["flag"]=="summary" 10 12
disp_text 0 dialogue 窓を\\s開けると\\n涼しい\\s風が\\s入ってきた。 Z_test 加藤<結衣:ゆい> {}
disp_text 0 dialogue issue34\\ssc_calc後の値は\${doc["count"]}です。 Z_test Issue<計算:けいさん> {}
effect_screen 0 {type:fade,color:black,opacity:0.45,duration:500}
end`;

// 7. Monaco エディタの生成
  editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: initialSampleCode,
    language: 'umsc',
    theme: 'vs-dark',
    automaticLayout: true,
    tabSize: 2
  });

  // ★ここから追加：スニペット入力中に半角スペースで次の引数（プレースホルダー）へ移動
  editor.addCommand(
    monaco.KeyCode.Space,
    function () {
      editor.trigger('snippet', 'jumpToNextSnippetPlaceholder', {});
    },
    'inSnippetMode' // スニペットの引数選択中のみ有効化する条件
  );

  // バリデーションの初回実行および内容変更時のリアルタイム反映
  const model = editor.getModel();
  validate(model);
  model.onDidChangeContent(() => {
    validate(model);
  });
});

// --- 画面上部ボタン用便利関数 ---

// テキストコピー機能
function copyText() {
  if (!editor) return;
  const text = editor.getValue();
  navigator.clipboard.writeText(text).then(() => {
    alert('シナリオテキストをクリップボードにコピーしました！');
  });
}

// .sc ファイルダウンロード機能
function downloadFile() {
  if (!editor) return;
  const text = editor.getValue();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scenario.sc';
  a.click();
  URL.revokeObjectURL(url);
}