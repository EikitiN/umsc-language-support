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
  "qr": {
    detail: "qr <識別記号1> [識別記号2...]",
    doc: "許可するQRコード識別記号を指定します。\n- 第一引数以降 (1つ以上): 許可するQRコード識別記号",
    snippet: "qr ${1:symbol}"
  },
  "change_classList": {
    detail: "change_classList <do_next> <セレクター> <クラス名> <add/remove> <時間>",
    doc: "指定要素のクラスを追加・削除します。\n- 第一引数: do_nextフラグ[0/1]\n- 第二引数: 設定する対象のセレクター\n- 第三引数: 編集するクラス名\n- 第四引数: add / remove\n- 第五引数: returnを返すまでの時間",
    snippet: "change_classList ${1:do_next} ${2:selector} ${3:className} ${4:add/remove} ${5:duration}"
  },
  "puzzle": {
    detail: "puzzle <謎解き番号> <答えの種類> <正しい回答> <正答時行> <誤答時行> <ギブアップ時行>",
    doc: "謎解き処理を実行し、結果に応じて指定行へジャンプします。\n- 第一引数: 謎解き番号\n- 第二引数: 答えの種類 (text / qr)\n- 第三引数: 正しい回答 / QRコードの文字列\n- 第四引数: 正答時に実行する行番号 (1-based)\n- 第五引数: 誤答時に実行する行番号 (1-based)\n- 第六引数: ギブアップ時に実行する行番号 (1-based)",
    snippet: "puzzle ${1:puzzleNum} ${2:type} ${3:answer} ${4:successLine} ${5:missLine} ${6:giveupLine}"
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

  /*
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
  });*/
  // 各コマンドで利用可能なJSONキーとその詳細説明の定義データベース
  const JSON_KEY_COMPLETIONS = {
    statusIMG: [
      { label: 'position', detail: '位置設定名', doc: 'settings/chara_settings.json の left, mid, center, right 等を指定' },
      { label: 'size', detail: 'サイズ設定名', doc: 'settings/chara_settings.json の chara, large, full 等を指定' },
      { label: 'x', detail: '横位置 (%)', doc: '対象要素の left に反映。数値は %' },
      { label: 'y', detail: '縦位置 (%)', doc: '対象要素の top に反映 (bottomはauto化)。数値は %' },
      { label: 'left', detail: '横位置 (%)', doc: 'x が指定されていない場合の left 指定。数値は %' },
      { label: 'top', detail: '縦位置 (%)', doc: 'y が指定されていない場合の top 指定。数値は %' },
      { label: 'bottom', detail: '下位置 (%)', doc: 'bottom に反映 (topはauto化)。数値は %' },
      { label: 'width', detail: '幅 (%)', doc: '数値は %' },
      { label: 'height', detail: '高さ (%)', doc: '数値は %' },
      { label: 'zIndex', detail: '重なり順 (z-index)', doc: '数値で指定' },
      { label: 'opacity', detail: '不透明度 (0.0〜1.0)', doc: '0(透明) 〜 1(不透明)' },
      { label: 'transformOrigin', detail: '回転/拡大基準点', doc: '例: "center center", "bottom center"' },
      { label: 'perspective', detail: '3D奥行き (px)', doc: 'rotateX/rotateYの遠近感。数値は px' },
      { label: 'translateX', detail: 'X移動量 (px)', doc: '数値は px' },
      { label: 'translateY', detail: 'Y移動量 (px)', doc: '数値は px' },
      { label: 'rotate', detail: 'Z軸回転 (deg)', doc: '数値は deg' },
      { label: 'rotateX', detail: 'X軸3D回転 (deg)', doc: '数値は deg' },
      { label: 'rotateY', detail: 'Y軸3D回転 (deg)', doc: '数値は deg' },
      { label: 'scale', detail: '拡大縮小率 (縦横両方)', doc: '1 が等倍 (例: 1.2)' },
      { label: 'scaleX', detail: '横方向拡大縮小率', doc: '1 が等倍' },
      { label: 'scaleY', detail: '縦方向拡大縮小率', doc: '1 が等倍' },
      { label: 'flipX', detail: '左右反転 (1/0)', doc: '1 で反転、0 で解除' },
      { label: 'flipY', detail: '上下反転 (1/0)', doc: '1 で反転、0 で解除' },
      { label: 'filter', detail: 'CSSフィルター直接指定', doc: 'None または none で解除' },
      { label: 'brightness', detail: '明るさ (%)', doc: '数値は % (例: 80, 120)' },
      { label: 'blur', detail: 'ぼかし (px)', doc: '数値は px' },
      { label: 'saturate', detail: '彩度 (%)', doc: '数値は %' },
      { label: 'duration', detail: '変化時間 (ms)', doc: 'アニメーション時間。数値は ms' },
      { label: 'easing', detail: 'イージング', doc: 'ease, linear, ease-in-out 等' }
    ],
    disp_text: [
      { label: 'color', detail: '文字色', doc: 'CSSカラーコード (例: "#ffdddd", "red")' },
      { label: 'fontWeight', detail: '文字の太さ', doc: 'bold, normal 等' },
      { label: 'ids', detail: '任意ID用スタイル設定', doc: '例: {"targetId":{"color":"red"}}' },
      { label: 'name', detail: '名前枠スタイル設定', doc: '例: {"name":{"color":"white"}}' },
      { label: 'nameFrame', detail: '名前フレームスタイル設定', doc: '例: {"nameFrame":{"opacity":"0.8"}}' },
      { label: 'fadeIn', detail: 'フェードイン有無 (1/0)', doc: '1 で有効、0 で無効 (デフォルト: 0)' },
      { label: 'fadeInDuration', detail: 'フェードイン時間 (秒)', doc: '秒数で指定 (デフォルト: 0.5)' },
      { label: 'fadeOut', detail: 'フェードアウト有無 (1/0)', doc: '1 で有効、0 で無効 (デフォルト: 0)' },
      { label: 'fadeOutDuration', detail: 'フェードアウト時間 (秒)', doc: '秒数で指定 (デフォルト: 0.5)' },
      { label: 'dimInactiveChara', detail: '非話者暗転有無 (1/0)', doc: '1 で他のキャラを暗くする (dialogue時デフォルト: 1)' },
      { label: 'speakerId', detail: '話者画像ID', doc: '第4引数の代わりに判定に使う画像ID' },
      { label: 'inactiveCharaBrightness', detail: '非話者時の明るさ (%)', doc: '数値は % (デフォルト: 55)' },
      { label: 'inactiveCharaDuration', detail: '非话者暗転フェード時間 (秒)', doc: '秒数で指定 (デフォルト: 0.3)' }
    ],
    status_text: [
      { label: 'color', detail: '文字色', doc: 'CSSカラーコード (例: "#ff99ff")' },
      { label: 'opacity', detail: '不透明度 (0.0〜1.0)', doc: '0(透明) 〜 1(不透明)' },
      { label: 'scale', detail: '文字拡大縮小率 (縦横両方)', doc: '1 が等倍 (例: 1.15)' },
      { label: 'scaleX', detail: '横方向拡大縮小率', doc: '1 が等倍' },
      { label: 'scaleY', detail: '縦方向拡大縮小率', doc: '1 が等倍' },
      { label: 'transformOrigin', detail: '拡大縮小基準点', doc: '例: "center center"' },
      { label: 'duration', detail: '変化時間 (ms)', doc: '色/拡大/透明度の変化時間。数値は ms' },
      { label: 'easing', detail: 'イージング', doc: '省略時は ease' },
      { label: 'shake', detail: '揺れ指定 (1/0 または px)', doc: '0 で解除、1 または揺れ幅数値(px)で実行' },
      { label: 'shakeAmount', detail: '揺れ幅 (px等)', doc: '例: "4px", "8px"' },
      { label: 'shakeDuration', detail: '揺れ時間 (ms)', doc: '数値は ms (デフォルト: 500)' },
      { label: 'shakeEasing', detail: '揺れイージング', doc: 'デフォルト: ease-in-out' },
      { label: 'shakeCount', detail: '揺れ繰り返し回数', doc: 'デフォルト: 1' }
    ]
  };

  // 3. 自動補完のプロバイダー
  monaco.languages.registerCompletionItemProvider('umsc', {
    triggerCharacters: ['{', ',', '"', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    provideCompletionItems: function (model, position) {
      const lineText = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineText.substring(0, position.column - 1);
      const firstWord = lineText.trim().split(/\s+/)[0];

      // カーソルが { と } の間に存在するか判定
      const lastOpenBrace = textUntilPosition.lastIndexOf('{');
      const lastCloseBrace = textUntilPosition.lastIndexOf('}');

      if (lastOpenBrace !== -1 && lastOpenBrace > lastCloseBrace) {
        // statusIMG / disp_text / status_text のいずれかの場合、設定キーをサジェスト
        if (JSON_KEY_COMPLETIONS[firstWord]) {
          const suggestions = JSON_KEY_COMPLETIONS[firstWord].map(item => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `${item.label}:`,
            detail: item.detail,
            documentation: item.doc
          }));
          return { suggestions: suggestions };
        }
      }

      // 通常のコマンド名補完
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

    // 許容する演算子リスト
    const validOperators = ['+', '-', '*', '/', '%', '^', '==', '!=', '>=', '<=', '>', '<'];
    // add_html の第三引数で許可するキーワード
    const validAddHtmlPositions = ['beforeend', 'afterbegin', 'beforebegin', 'afterend'];
    // clearvar の第三引数で許可するモード
    const validClearvarModes = ['1', '2', '3'];

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
        return;
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

      // ⑤ 引数の型・値のバリデーションチェック
      const args = tokens.slice(1);

      // --- 共通ルール: do_next フラグのチェック (第1引数が do_next のコマンド) ---
      const hasDoNext = ['setvar', 'sc_calc', 'dispIMG', 'statusIMG', 'sympleBGchange', 'console_dispvar', 'release_arasuzi', 'disp_text', 'status_text', 'effect_screen', 'add_html', 'parallel', 'clearvar', 'clear_backlog', 'change_classList'].includes(command);
      if (hasDoNext && args[0] !== undefined) {
        if (args[0] !== '0' && args[0] !== '1') {
          const col = lineText.indexOf(args[0]) + 1;
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `do_next フラグには 0 または 1 のみを指定してください。 (入力値: '${args[0]}')`,
            startLineNumber: lineNumber,
            startColumn: col,
            endLineNumber: lineNumber,
            endColumn: col + args[0].length
          });
        }
      }

      // --- コマンド固有チェック ---

      // sc_if: 第2・第3引数が自然数（行番号）か
      if (command === 'sc_if') {
        [1, 2].forEach((argIdx) => {
          if (args[argIdx] !== undefined) {
            const val = Number(args[argIdx]);
            if (isNaN(val) || !Number.isInteger(val) || val <= 0) {
              const col = lineText.indexOf(args[argIdx]) + 1;
              markers.push({
                severity: monaco.MarkerSeverity.Error,
                message: `ジャンプ先の行番号 (第${argIdx + 1}引数) には 1 以上の整数を指定してください。 (入力値: '${args[argIdx]}')`,
                startLineNumber: lineNumber,
                startColumn: col,
                endLineNumber: lineNumber,
                endColumn: col + args[argIdx].length
              });
            }
          }
        });
      }

      // dispIMG: 第3/5引数が 0/1 か、第6引数が非負数値か
      else if (command === 'dispIMG') {
        // 第3引数 (表示フラグ) & 第5引数 (フェード有無)
        [2, 4].forEach((argIdx, idx) => {
          if (args[argIdx] !== undefined && args[argIdx] !== '0' && args[argIdx] !== '1') {
            const label = idx === 0 ? '表示フラグ (第3引数)' : 'フェード有無 (第5引数)';
            const col = lineText.indexOf(args[argIdx]) + 1;
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              message: `${label} には 0 または 1 を指定してください。 (入力値: '${args[argIdx]}')`,
              startLineNumber: lineNumber,
              startColumn: col,
              endLineNumber: lineNumber,
              endColumn: col + args[argIdx].length
            });
          }
        });

        // 第6引数 (フェード時間)
        if (args[5] !== undefined) {
          const duration = Number(args[5]);
          if (isNaN(duration) || duration < 0) {
            const col = lineText.indexOf(args[5]) + 1;
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              message: `フェード時間 (第6引数) には 0 以上の数値(秒)を指定してください。 (入力値: '${args[5]}')`,
              startLineNumber: lineNumber,
              startColumn: col,
              endLineNumber: lineNumber,
              endColumn: col + args[5].length
            });
          }
        }
      }

      // add_html: 第3引数が beforeend / afterbegin / beforebegin / afterend のいずれか
      else if (command === 'add_html') {
        if (args[2] !== undefined && !validAddHtmlPositions.includes(args[2])) {
          const col = lineText.indexOf(args[2]) + 1;
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `追加位置 (第3引数) には [beforeend, afterbegin, beforebegin, afterend] のいずれかを指定してください。 (入力値: '${args[2]}')`,
            startLineNumber: lineNumber,
            startColumn: col,
            endLineNumber: lineNumber,
            endColumn: col + args[2].length
          });
        }
      }

      // clearvar: 第3引数が 1, 2, 3 のいずれか
      else if (command === 'clearvar') {
        if (args[2] !== undefined && !validClearvarModes.includes(args[2])) {
          const col = lineText.indexOf(args[2]) + 1;
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `設定モード (第3引数) には 1, 2, 3 のいずれかを指定してください。 (入力値: '${args[2]}')`,
            startLineNumber: lineNumber,
            startColumn: col,
            endLineNumber: lineNumber,
            endColumn: col + args[2].length
          });
        }
      }

      // sc_calc: 演算子チェック
      else if (command === 'sc_calc') {
        if (args[2] && !validOperators.includes(args[2])) {
          const col = lineText.indexOf(args[2]) + 1;
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `不正な演算子です: '${args[2]}' (使用可能: +, -, *, /, %, ^, ==, !=, >=, <=, >, <)`,
            startLineNumber: lineNumber,
            startColumn: col,
            endLineNumber: lineNumber,
            endColumn: col + args[2].length
          });
        }
      }

      // jumpto: 数値チェック
      else if (command === 'jumpto') {
        if (args[0] && isNaN(Number(args[0]))) {
          const col = lineText.indexOf(args[0]) + 1;
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `行番号には数値を指定してください。 (入力値: '${args[0]}')`,
            startLineNumber: lineNumber,
            startColumn: col,
            endLineNumber: lineNumber,
            endColumn: col + args[0].length
          });
        }
      }

      // puzzle: 数値チェック
      else if (command === 'puzzle') {
        [3, 4, 5].forEach((argIdx) => {
          if (args[argIdx] && isNaN(Number(args[argIdx]))) {
            const col = lineText.indexOf(args[argIdx]) + 1;
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              message: `ジャンプ先候補 (第${argIdx + 1}引数) には行番号（数値）を指定してください。`,
              startLineNumber: lineNumber,
              startColumn: col,
              endLineNumber: lineNumber,
              endColumn: col + args[argIdx].length
            });
          }
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