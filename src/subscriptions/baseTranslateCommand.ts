import clipboard from "clipboardy";
import fetch from "node-fetch";
import {
  ExtensionContext,
  Range,
  ViewColumn,
  WebviewPanel,
  commands,
  window,
} from "vscode";
import { getBdTranslateConfig } from "../utils";
import {
  COMMAND_KEYS,
  COMMAND_PREFIX,
  NAME_MAP,
  TRANS_KEYS,
} from "../constants";

const md5 = require("md5");

const pannelKey = `${COMMAND_PREFIX}.translateView`;

class TranslateProvider {
  public static readonly viewType = pannelKey;
  private _view?: WebviewPanel;
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  init() {
    if (!this._view) {
      this._view = window.createWebviewPanel(
        pannelKey,
        "翻译",
        ViewColumn.Beside,
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
            window.showInformationMessage("复制成功");
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

export default (context: ExtensionContext) => {
  return commands.registerCommand(COMMAND_KEYS.translate, () => {
    const translateProvider = new TranslateProvider(context);
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    if (editor.selection.isEmpty) {
      window.showWarningMessage("请勾选翻译文本再翻译");
      return;
    }
    const { getText } = editor?.document;
    const selectText = getText(
      new Range(editor.selection.anchor, editor.selection.end)
    );
    translateProvider.translate(selectText);
  });
};
