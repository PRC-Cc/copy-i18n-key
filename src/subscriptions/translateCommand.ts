import clipboard from "clipboardy";
import fetch from "node-fetch";
import {
  ExtensionContext,
  Range,
  Uri,
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
import { contentGenerator, myScript, header, footer } from "./template";
import { transform } from "../utils/parse";

const md5 = require("md5");

export const providerRef: { current: TranslateProvider | undefined } = {
  current: undefined,
};

const pannelKey = `${COMMAND_PREFIX}.translateView`;
class TranslateProvider {
  public static readonly viewType = pannelKey;
  private _view?: WebviewPanel;
  _extensionUri: Uri;
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
    this._extensionUri = context.extensionUri;
  }
  getResourcePath(...paths: string[]) {
    const resourcePathOnDisk = Uri.joinPath(this._extensionUri, ...paths);
    const resourceUri = this._view?.webview.asWebviewUri(resourcePathOnDisk);
    return resourceUri;
  }
  init() {
    if (!this._view) {
      this._view = window.createWebviewPanel(
        pannelKey,
        "翻译",
        ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
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
            break;
          case "insert":
            this.insert(message.data);
            break;
          case "refresh":
            this.refresh();
            break;
          case "translate":
            this.translate(message.data);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
    this._view.onDidDispose(() => {
      providerRef.current = undefined;
    });
  }
  insert(data: { type: TI18nKey; key: string; value: string }) {
    transform(data.type, data.key, data.value);
  }
  refresh() {
    let enable = false;
    const config = getBdTranslateConfig();
    if (config?.appID && config?.secretKey) {
      enable = true;
    }
    this._view?.webview.postMessage({
      command: "changeTranslateStatus",
      data: enable,
    });
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
  show(word: string) {
    if (this._view) {
      this._view.reveal();
      if (!word) {
        return;
      }
      this._view.webview.postMessage({
        command: "changeKey",
        data: word,
      });
      return;
    }
    this.init();
    if (this._view) {
      (<WebviewPanel>this._view).webview.html = this.gethtml(word);
    }
  }
  async translate(word: string) {
    const config = getBdTranslateConfig();
    if (!config) {
      window.showWarningMessage("翻译配置未设置");
      return;
    }
    const { appID, secretKey } = config;
    if (!appID || !secretKey) {
      window.showWarningMessage("翻译配置未设置");
      return;
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
          _[NAME_MAP[TRANS_KEYS[index]]] = now;
          return _;
        }, {} as any);

        this._view?.webview.postMessage({
          command: "translate",
          data,
        });
      });
  }
  gethtml(key?: string) {
    const config = getBdTranslateConfig();
    const isBdTranslateEnable = Boolean(
      config && config.appID && config.secretKey
    );

    let appendScript = "";

    if (key) {
      appendScript += `$(".inp-key").value = "${key}"`;
    }

    if (appendScript !== "") {
      appendScript = `<script>${appendScript}</script>`;
    }

    return (
      header +
      contentGenerator(isBdTranslateEnable) +
      myScript +
      appendScript +
      footer
    );
  }
}

export default (context: ExtensionContext) => {
  return commands.registerCommand(COMMAND_KEYS.addI18n, () => {
    if (!providerRef.current) {
      providerRef.current = new TranslateProvider(context);
    }
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const { getText } = editor?.document;
    const selectText = getText(
      new Range(editor.selection.anchor, editor.selection.end)
    );
    providerRef.current.show(selectText);
  });
};
