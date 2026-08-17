import * as vscode from 'vscode';

interface CommandSpec {
  name: string;
  minArgs: number;
  maxArgs: number;
  description: string;
  example: string;
  warning?: string;
  checkDoNext?: boolean;
}

// 仕様書に基づくコマンド定義
const COMMAND_SPECS: Record<string, CommandSpec> = {
  'sc_if': {
    name: 'sc_if',
    minArgs: 3,
    maxArgs: 3,
    description: '条件分岐を行います。\n第1引数: 条件式\n第2引数: true時実行行(1-based)\n第3引数: false時実行行(1-based)',
    example: 'sc_if issue34_check["flag"]=="summary" 110 111'
  },
  'jumpto': {
    name: 'jumpto',
    minArgs: 1,
    maxArgs: 1,
    description: '指定した行へジャンプします。\n第1引数: 実行行番号(1-based)',
    example: 'jumpto 135'
  },
  'setvar': {
    name: 'setvar',
    minArgs: 3,
    maxArgs: 3,
    description: '変数を設定します。\n第1引数: do_next[0/1]\n第2引数: 変数名\n第3引数: 代入値',
    example: 'setvar 1 i["value"] "振り返りの値"',
    checkDoNext: true
  },
  'sc_calc': {
    name: 'sc_calc',
    minArgs: 4,
    maxArgs: 4,
    description: '計算を行います。\n第1引数: do_next[0/1]\n第2引数: 変数\n第3引数: 演算子(+,-,*,/,%,^)\n第4引数: 値/変数',
    example: 'sc_calc 1 doc["count"] % 2',
    checkDoNext: true
  },
  'dialogue': {
    name: 'dialogue',
    minArgs: 5,
    maxArgs: 5,
    description: '【テスト用】対話テキストを表示します。',
    example: 'dialogue 内容 normal charaA 表示名 オプション',
    warning: 'テスト用関数です。disp_text へ統合されているため警告となります。'
  },
  'debug_dispvar': {
    name: 'debug_dispvar',
    minArgs: 3,
    maxArgs: 3,
    description: '【テスト用】変数を表示します。',
    example: 'debug_dispvar path 1 0',
    warning: 'テスト用関数です。disp_text へ統合されているため警告となります。'
  },
  'dispIMG': {
    name: 'dispIMG',
    minArgs: 6,
    maxArgs: 7,
    description: '画像を表示・操作します。\n第1引数: do_next[0/1]\n第2引数: 表示先(bg/chara/back/front/id)\n第3引数: 表示フラグ[1/0]\n第4引数: 画像パス\n第5引数: フェード有無[1/0]\n第6引数: フェード時間[s]\n第7引数(任意): 画像要素id',
    example: 'dispIMG 0 chara 1 material/chara.webp 1 0.5 kabura',
    checkDoNext: true
  },
  'statusIMG': {
    name: 'statusIMG',
    minArgs: 3,
    maxArgs: 3,
    description: '画像の状態(位置/倍率/回転等)を変更します。\n第1引数: do_next[0/1]\n第2引数: 対象id\n第3引数: 状態設定オブジェクト',
    example: 'statusIMG 0 kabura {position:right,rotate:8,duration:800}',
    checkDoNext: true
  },
  'sympleBGchange': {
    name: 'sympleBGchange',
    minArgs: 4,
    maxArgs: 4,
    description: '【テスト用】背景を変更します。',
    example: 'sympleBGchange path 1 0 1',
    warning: 'テスト用関数です。dispIMG へ統合されているため警告となります。'
  },
  'console_dispvar': {
    name: 'console_dispvar',
    minArgs: 2,
    maxArgs: 2,
    description: '【テスト用】コンソールに変数を表示します。',
    example: 'console_dispvar path 1',
    warning: 'テスト用関数です。disp_text へ統合されているため警告となります。'
  },
  'clear_scline_counter': {
    name: 'clear_scline_counter',
    minArgs: 0,
    maxArgs: 0,
    description: '同一行の実行回数制限カウンターをリセットします。',
    example: 'clear_scline_counter'
  },
  'release_arasuzi': {
    name: 'release_arasuzi',
    minArgs: 2,
    maxArgs: 2,
    description: 'あらすじ番号を解放します。\n第1引数: do_next[0/1]\n第2引数: あらすじ番号',
    example: 'release_arasuzi 1 2',
    checkDoNext: true
  },
  'disp_text': {
    name: 'disp_text',
    minArgs: 6,
    maxArgs: 7,
    description: 'テキストを表示します。\n第1引数: do_next[0/1]\n第2引数: 表示場所\n第3引数: 表示内容\n第4引数: スタイル/キャラid\n第5引数: 表示名\n第6引数: 設定オブジェクト\n第7引数(任意): セリフ欄クリア[1/0]',
    example: 'disp_text 0 dialogue こんにちは Z_test 表示名 {}',
    checkDoNext: true
  },
  'status_text': {
    name: 'status_text',
    minArgs: 3,
    maxArgs: 3,
    description: 'テキストの状態・演出を変更します。\n第1引数: do_next[0/1]\n第2引数: 対象id\n第3引数: 状態設定オブジェクト',
    example: 'status_text 0 dialogue {color:white,scale:1}',
    checkDoNext: true
  },
  'effect_screen': {
    name: 'effect_screen',
    minArgs: 2,
    maxArgs: 99,
    description: '画面全体のエフェクトを設定します。\n第1引数: do_next[0/1]\n第2引数以降: エフェクト設定',
    example: 'effect_screen 0 {type:fade,color:black,duration:500}',
    checkDoNext: true
  },
  'add_html': {
    name: 'add_html',
    minArgs: 4,
    maxArgs: 99,
    description: '指定要素にHTMLを追加します。\n第1引数: do_next[0/1]\n第2引数: 親要素id\n第3引数: 位置(beforeend/afterbegin等)\n第4引数以降: 追加HTML',
    example: 'add_html 0 dialogue beforeend <span\\sid="test">text</span>',
    checkDoNext: true
  },
  'parallel': {
    name: 'parallel',
    minArgs: 3,
    maxArgs: 3,
    description: '並列処理を行います(未実装)。',
    example: 'parallel 1 lineA lineB',
    warning: '未実装の関数です。'
  },
  'clearvar': {
    name: 'clearvar',
    minArgs: 3,
    maxArgs: 3,
    description: '変数をクリアします。\n第1引数: do_next[0/1]\n第2引数: 変数パス\n第3引数: 設定(1:undefined置換, 2:削除, 3:最外層undefined)',
    example: 'clearvar 1 issue34_check["value"] 3',
    checkDoNext: true
  },
  'clear_backlog': {
    name: 'clear_backlog',
    minArgs: 1,
    maxArgs: 1,
    description: 'ここまでのバックログを破棄します。\n第1引数: do_next[0/1]',
    example: 'clear_backlog 1',
    checkDoNext: true
  },
  '-': {
    name: '-',
    minArgs: 0,
    maxArgs: 0,
    description: '行を埋めるためのダミーコマンド。',
    example: '-'
  },
  'end': {
    name: 'end',
    minArgs: 0,
    maxArgs: 0,
    description: 'シナリオの最後を示します。',
    example: 'end'
  }
};

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('umsc');
  context.subscriptions.push(diagnosticCollection);

  // エラー検証処理
  const validateDocument = (document: vscode.TextDocument) => {
    if (document.languageId !== 'umsc') {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text;

      // 1. 空白行チェック (正書法: 空白行をつくらない)
      if (text.trim() === '') {
        const range = new vscode.Range(i, 0, i, text.length);
        diagnostics.push(new vscode.Diagnostic(
          range,
          '正書法違反: 空白行は許可されていません。',
          vscode.DiagnosticSeverity.Error
        ));
        continue;
      }

      // 引数分解（半角スペース区切り）
      const tokens = text.trim().split(/\s+/);
      const cmdName = tokens[0];
      const args = tokens.slice(1);

      // 2. 未定義コマンドチェック
      const spec = COMMAND_SPECS[cmdName];
      if (!spec) {
        const range = new vscode.Range(i, 0, i, cmdName.length);
        diagnostics.push(new vscode.Diagnostic(
          range,
          `未定義のコマンドです: "${cmdName}"`,
          vscode.DiagnosticSeverity.Error
        ));
        continue;
      }

      // 3. テスト用・未実装関数の警告チェック
      if (spec.warning) {
        const range = new vscode.Range(i, 0, i, cmdName.length);
        diagnostics.push(new vscode.Diagnostic(
          range,
          spec.warning,
          vscode.DiagnosticSeverity.Warning
        ));
      }

      // 4. 引数の過不足チェック
      if (args.length < spec.minArgs || args.length > spec.maxArgs) {
        const range = new vscode.Range(i, 0, i, text.length);
        const expected = spec.minArgs === spec.maxArgs ? `${spec.minArgs}` : `${spec.minArgs}～${spec.maxArgs}`;
        diagnostics.push(new vscode.Diagnostic(
          range,
          `引数の数が不正です: "${cmdName}" は ${expected} 個の引数を必要としますが、${args.length} 個指定されています。`,
          vscode.DiagnosticSeverity.Error
        ));
      }

      // 5. do_next フラグチェック (0 または 1 のみ許可)
      if (spec.checkDoNext && args.length > 0) {
        const doNextVal = args[0];
        if (doNextVal !== '0' && doNextVal !== '1') {
          const cmdLength = cmdName.length;
          const startIdx = text.indexOf(doNextVal, cmdLength);
          const range = new vscode.Range(i, startIdx, i, startIdx + doNextVal.length);
          diagnostics.push(new vscode.Diagnostic(
            range,
            `do_nextフラグの型・値が不正です: "0" または "1" を指定してください (入力値: "${doNextVal}")`,
            vscode.DiagnosticSeverity.Error
          ));
        }
      }
    }

    diagnosticCollection.set(document.uri, diagnostics);
  };

  // ドキュメント変更・オープン時のイベント登録
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => validateDocument(e.document)),
    vscode.workspace.onDidOpenTextDocument(doc => validateDocument(doc))
  );

  // 既に開いているドキュメントも検証
  if (vscode.window.activeTextEditor) {
    validateDocument(vscode.window.activeTextEditor.document);
  }

  // 自動補完（CompletionProvider）
  const completionProvider = vscode.languages.registerCompletionItemProvider('umsc', {
    provideCompletionItems() {
      return Object.values(COMMAND_SPECS).map(spec => {
        const item = new vscode.CompletionItem(spec.name, vscode.CompletionItemKind.Function);
        item.detail = spec.example;
        item.documentation = new vscode.MarkdownString(spec.description);
        return item;
      });
    }
  });

  // ホバーヘルプ（HoverProvider）
  const hoverProvider = vscode.languages.registerHoverProvider('umsc', {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);
      const spec = COMMAND_SPECS[word];

      if (spec) {
        const markdown = new vscode.MarkdownString();
        markdown.appendCodeblock(spec.example, 'umsc');
        markdown.appendMarkdown(`\n${spec.description}`);
        if (spec.warning) {
          markdown.appendMarkdown(`\n\n**警告**: ${spec.warning}`);
        }
        return new vscode.Hover(markdown);
      }
    }
  });

  context.subscriptions.push(completionProvider, hoverProvider);
}

export function deactivate() {}