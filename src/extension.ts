// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import clipboard from "clipboardy";
import fetch from "node-fetch";
import { Location, commands, languages, window, workspace } from "vscode";
import { Uri } from "vscode";
import { Range } from "vscode";
import { Position } from "vscode";

const fs = require("node:fs");
const md5 = require("md5");
const parse = require("json-to-ast");

type TTrans = "en" | "cht";
const TRANS_KEYS: TTrans[] = ["cht", "en"];
const NAME_MAP: Record<TTrans, string> = {
  en: "英文",
  cht: "繁体",
};

const I18N_KEYS: ("zh_CN" | "zh_TW" | "en")[] = ["zh_CN", "zh_TW", "en"];

function getParamPosition(fileStr: string, originParamPaths: string[]) {
  const info = parse(fileStr, { loc: true });
  if (info.type !== "Object") {
    vscode.window.showWarningMessage("i18n文件格式错误");
    return;
  }
  const keys: string[] = [...originParamPaths];
  let temp = info.children;
  let startPos: any;
  while (true) {
    let goon = true;
    const find = temp.some((item: any) => {
      const { key, value, loc } = item;
      const { start } = loc;
      if (key.value === keys[0]) {
        startPos = start;
        if (keys.length === 1 || value.type !== "Object") {
          goon = false;
        } else {
          keys.shift();
          temp = value.children;
        }
        return true;
      }
      return false;
    });
    if (!find) {
      goon = false;
    }
    if (!goon) {
      break;
    }
  }
  if (!startPos) {
    return undefined;
  }
  return new Position(startPos.line - 1, startPos.column);
}

const checkEnableI18n = () => {
  if (vscode.workspace.workspaceFolders?.[0].uri.path) {
    const zhCNPath =
      workspace.workspaceFolders?.[0].uri.path + "/src/i18n/zh_CN.json";
    const enPath =
      workspace.workspaceFolders?.[0].uri.path + "/src/i18n/en.json";
    const zhTWPath =
      workspace.workspaceFolders?.[0].uri.path + "/src/i18n/zh_TW.json";

    if (fs.existsSync(enPath)) {
      commands.executeCommand(
        "setContext",
        "copyI18nKey.enableGotoI18nEn",
        true
      );
    }
    if (fs.existsSync(zhTWPath)) {
      commands.executeCommand(
        "setContext",
        "copyI18nKey.enableGotoI18nZhTW",
        true
      );
    }
    if (fs.existsSync(zhCNPath)) {
      commands.executeCommand(
        "setContext",
        "copyI18nKey.enableGotoI18nZhCN",
        true
      );
    }
  }
};

const gotoI18nPosition = (
  document: vscode.TextEditor,
  i18nKey: "zh_CN" | "en" | "zh_TW",
  text = window.activeTextEditor?.document?.getText?.(document.selection)
) => {
  if (!text) {
    return;
  }
  const zhCNPath =
    workspace.workspaceFolders?.[0].uri.path + `/src/i18n/${i18nKey}.json`;
  const isExists = fs.existsSync(zhCNPath);
  if (!isExists) {
    return;
  }
  const targetFileStr = fs.readFileSync(zhCNPath, "utf-8") as string;
  const targetPosition = getParamPosition(targetFileStr, text.split("."));
  if (!targetPosition) {
    window.showWarningMessage("未找到跳转位置");
    return;
  }
  workspace.openTextDocument(Uri.file(zhCNPath)).then((document) => {
    window.showTextDocument(document, {
      selection: new Range(targetPosition, targetPosition),
    });
  });
};

const getBdTranslateConfig = () => {
  const configuration = vscode.workspace.getConfiguration();
  const currentValue = configuration.get<{ appID: string; secretKey: string }>(
    "conf.settingsEditor.bdTranslateSetting"
  );

  if (currentValue) {
    const { appID, secretKey } = currentValue!;
    return { appID, secretKey };
  }
  return null;
};

const configTranlateEnv = () => {
  const bdTranslateConfig = getBdTranslateConfig();
  let enable = false;
  if (bdTranslateConfig) {
    const { appID, secretKey } = bdTranslateConfig!;
    if (appID !== "" && secretKey !== "") {
      enable = true;
    }
  }
  vscode.commands.executeCommand(
    "setContext",
    "copyI18nKey.enableTranslate",
    enable
  );
};

function gotoI18nJson(document: vscode.TextDocument, position: Position): any {
  const keys = getSelectKeys();
  if (!keys) {
    return;
  }

  const rs = document.fileName.match(/^(.*\/)(.*)\.json$/);
  console.log("rs: ", rs);
  if (!rs) {
    return;
  }
  const [, prefix, currentKey] = rs;
  const otherKeys = I18N_KEYS.filter((item) => item !== currentKey);
  console.log("otherKeys: ", otherKeys);
  if (otherKeys.length === 0) {
    return;
  }
  return otherKeys
    .map((item) => {
      const filePath = `${prefix}${item}.json`;
      if (fs.existsSync(filePath)) {
        const fileStr = fs.readFileSync(filePath, "utf-8");
        const position = getParamPosition(fileStr, keys);
        if (position) {
          return new Location(Uri.file(filePath), position);
        }
        return;
      }
      return;
    })
    .filter((item) => item !== undefined && item !== null);
}

class TranslateProvider {
  public static readonly viewType = "copyI18nKey.translateView";
  private _view?: vscode.WebviewPanel;
  context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  init() {
    if (!this._view) {
      this._view = vscode.window.createWebviewPanel(
        "copyI18nKey.translateView",
        "翻译",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
        }
      );
    }
    this._view.onDidDispose(() => {
      this._view = undefined;
    });
    this._view.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "copy":
            clipboard.writeSync(message.text);
            vscode.window.showInformationMessage("复制成功");
            return;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }
  show() {
    this.init();
  }
  hide() {
    this._view?.dispose();
    this._view = undefined;
  }
  getBdTranslateUrl(q: string, to: "en" | "zh" | "cht") {
    const config = getBdTranslateConfig();
    const { appID, secretKey } = config!;
    const from = "auto";
    const salt = "19944991";
    const composeStr = appID + q + salt + secretKey;
    const sign = md5(composeStr);
    const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${q}&from=${from}&to=${to}&appid=${appID}&salt=${salt}&sign=${sign}`;
    return url;
  }
  async translate(word: string) {
    if (word === "") {
      return;
    }
    const bdTranslateConfig = getBdTranslateConfig();
    if (!bdTranslateConfig) {
      return;
    }
    if (!this._view) {
      this.init();
    }
    if (!this._view) {
      return;
    }

    const config = getBdTranslateConfig();
    if (!config) {
      return null;
    }
    const { appID, secretKey } = config;
    if (!appID || !secretKey) {
      return null;
    }

    const fetchGenerator = (key: TTrans) => {
      const chtUrl = this.getBdTranslateUrl(word, key);
      return fetch(chtUrl)
        .then((d) => {
          return d.json();
        })
        .then((d: any) => {
          const { dst } = d?.trans_result?.[0] ?? {};
          return dst;
        });
    };

    this._view.webview.html = this.getHtml("loading", word);
    const rs: string[] = [];
    const chainFn = TRANS_KEYS.slice(1).reduce<TTrans | Function>(
      (pre, now) => {
        return async () => {
          if (typeof pre === "string") {
            await fetchGenerator(pre).then((d) => {
              rs.push(d);
            });
          } else if (typeof pre === "function") {
            await pre();
          }
          await new Promise((res) => {
            setTimeout(() => {
              res(1);
              // 防止百度翻译接口请求过快
            }, 1e3);
          }).then(() => {
            return fetchGenerator(now).then((d) => {
              rs.push(d);
            });
          });
        };
      },
      TRANS_KEYS[0]
    );

    typeof chainFn === "function" &&
      chainFn().then(() => {
        const data: Record<TTrans, string> = rs.reduce((_, now, index) => {
          _[TRANS_KEYS[index]] = now;
          return _;
        }, {} as any);
        this._view!.webview.html = this.getHtml("result", word, data);
      });
  }
  getHtml(
    type: "loading" | "result",
    word: string,
    rs: Record<TTrans, string> = {
      en: "",
      cht: "",
    }
  ) {
    const copySvgGenerator = (text: string) =>
      `<svg onclick="copyText(\'${text}\')" t="1680349067141" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4275" width="64" height="64"><path d="M768 256a85.333333 85.333333 0 0 1 85.333333 85.333333v512a85.333333 85.333333 0 0 1-85.333333 85.333334h-341.333333a85.333333 85.333333 0 0 1-85.333334-85.333334V341.333333a85.333333 85.333333 0 0 1 85.333334-85.333333h341.333333z m0 85.333333h-341.333333v512h341.333333V341.333333z m-128-256a42.666667 42.666667 0 0 1 42.666667 42.666667l-0.042667 42.666667H256l-0.042667 597.333333H213.333333a42.666667 42.666667 0 0 1-42.666666-42.666667V170.666667a85.333333 85.333333 0 0 1 85.333333-85.333334h384z" fill="#000000" p-id="4276"></path></svg>`;
    let content = `<h2>原文：${word}</h2>`;
    if (type === "loading") {
      content += `<h2>翻译中...</h2>`;
    } else if (type === "result") {
      content += TRANS_KEYS.map(
        (i) => `<h2>${NAME_MAP[i]}：${rs[i]}${copySvgGenerator(rs[i])}</h2>`
      ).join("\n");
    }
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
      svg{
        width: 32px;
        height: 32px;
        vertical-align: middle;
        margin-left: 10px;
        cursor: pointer;
      }
      svg path{
        fill: #cccccc;
      }
      svg:hover path{
        fill: green;
      }
      </style>
    </head>
    <body>
      ${content}
      <script>
          const vscode = acquireVsCodeApi();
          function copyText(text) {
            if(text){
              vscode.postMessage({
                command: 'copy',
                text
              })
            }
          }
      </script>
    </body>
    </html>`;
  }
}

const getSelectKeys = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const { getText } = editor?.document;
  const anchorPos = editor.document.offsetAt(editor.selection.anchor);
  const allText = getText(
    new vscode.Range(
      new vscode.Position(0, 0),
      editor.document.lineAt(editor.document.lineCount - 1).range.end
    )
  );
  const info = parse(allText, { loc: true });
  if (info.type !== "Object") {
    vscode.window.showWarningMessage("i18n文件格式错误");
    return;
  }
  const keys: string[] = [];
  let temp = info.children;
  while (true) {
    let goon = true;
    temp.some((item: any) => {
      var {
        start: { offset: startOffset },
        end: { offset: endOffset },
      } = item.loc;
      if (anchorPos < startOffset) {
        goon = false;
        return true;
      }
      if (anchorPos > endOffset) {
        return false;
      }
      const { key, value } = item;

      var {
        start: { offset: startOffset },
        end: { offset: endOffset },
      } = key.loc;
      if (anchorPos >= startOffset && anchorPos <= endOffset) {
        keys.push(key.value);
        goon = false;
      } else if (value.type === "Object") {
        keys.push(key.value);
        temp = value.children;
      } else {
        keys.push(key.value);
        goon = false;
      }
      return true;
    });
    if (!goon) {
      break;
    }
  }
  return keys;
};

export function activate(context: vscode.ExtensionContext) {
  configTranlateEnv();
  const translateProvider = new TranslateProvider(context);
  let copyDisposable = vscode.commands.registerCommand(
    "copyI18nKey.copyI18nKey",
    () => {
      const keys = getSelectKeys();
      if (!keys) {
        return;
      }
      clipboard.writeSync(keys.join("."));
      vscode.window.showInformationMessage(
        `i18n key复制成功：${keys.join(".")}`
      );
    }
  );

  const translateDisposable = vscode.commands.registerCommand(
    "copyI18nKey.translate",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      if (editor.selection.isEmpty) {
        vscode.window.showWarningMessage("请勾选翻译文本再翻译");
        return;
      }
      const { getText } = editor?.document;
      const selectText = getText(
        new vscode.Range(editor.selection.anchor, editor.selection.end)
      );
      translateProvider.translate(selectText);
    }
  );

  const reloadTranslateDisposable = vscode.commands.registerCommand(
    "copyI18nKey.reloadTranslate",
    () => {
      configTranlateEnv();
    }
  );

  checkEnableI18n();

  const gotoI18nDisposables = I18N_KEYS.map((item) =>
    vscode.commands.registerTextEditorCommand(
      `copyI18nKey.gotoI18n_${item}`,
      (document) => {
        gotoI18nPosition(document, item);
      }
    )
  );

  const gotoI18nJsonDisposable = languages.registerDefinitionProvider(
    ["json"],
    {
      provideDefinition: gotoI18nJson,
    }
  );

  context.subscriptions.push(
    copyDisposable,
    translateDisposable,
    reloadTranslateDisposable,
    gotoI18nJsonDisposable,
    ...gotoI18nDisposables
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
