import {
  FileSystemWatcher,
  Position,
  Range,
  Uri,
  commands,
  window,
  workspace,
} from "vscode";

const parse = require("json-to-ast");
const fs = require("node:fs");

const getSelectKeys = () => {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  const { getText } = editor?.document;
  const anchorPos = editor.document.offsetAt(editor.selection.anchor);
  const allText = getText(
    new Range(
      new Position(0, 0),
      editor.document.lineAt(editor.document.lineCount - 1).range.end
    )
  );
  const info = parse(allText, { loc: true });
  if (info.type !== "Object") {
    window.showWarningMessage("i18n文件格式错误");
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

const getBdTranslateConfig = () => {
  const configuration = workspace.getConfiguration();
  const currentValue = configuration.get<{ appID: string; secretKey: string }>(
    "conf.settingsEditor.bdTranslateSetting"
  );

  if (currentValue) {
    const { appID, secretKey } = currentValue!;
    return { appID, secretKey };
  }
  return null;
};

function getParamPosition(fileStr: string, originParamPaths: string[]) {
  const info = parse(fileStr, { loc: true });
  if (info.type !== "Object") {
    window.showWarningMessage("i18n文件格式错误");
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
  if (workspace.workspaceFolders?.[0].uri.path) {
    const zhCNPath =
      workspace.workspaceFolders?.[0].uri.path + "/src/i18n/zh_CN.json";
    const enPath =
      workspace.workspaceFolders?.[0].uri.path + "/src/i18n/en.json";
    const zhTWPath =
      workspace.workspaceFolders?.[0].uri.path + "/src/i18n/zh_TW.json";

    commands.executeCommand(
      "setContext",
      "copyI18nKey.enableGotoI18nEn",
      fs.existsSync(enPath)
    );
    commands.executeCommand(
      "setContext",
      "copyI18nKey.enableGotoI18nZhTW",
      fs.existsSync(zhTWPath)
    );
    commands.executeCommand(
      "setContext",
      "copyI18nKey.enableGotoI18nZhCN",
      fs.existsSync(zhCNPath)
    );
  }
};

const checkI18nExists = (i18nKey: TI18nKey) => {
  const i18nPath =
    workspace.workspaceFolders?.[0].uri.path + `/src/i18n/${i18nKey}.json`;
  const isExists = fs.existsSync(i18nPath);
  return {
    path: i18nPath,
    isExists,
  };
};

let fileWatcher: FileSystemWatcher | undefined;
const watchFile = () => {
  if (!workspace.workspaceFolders) {
    return;
  }
  const workspaceFolder = workspace.workspaceFolders[0];
  fileWatcher = workspace.createFileSystemWatcher(
    `${workspaceFolder.uri.fsPath}/src/i18n/*.json`
  );

  fileWatcher.onDidCreate((uri: Uri) => {
    checkEnableI18n();
  });

  fileWatcher.onDidDelete((uri: Uri) => {
    checkEnableI18n();
  });
};

const unWatchFile = () => {
  fileWatcher?.dispose();
  fileWatcher = undefined;
};

export {
  watchFile,
  unWatchFile,
  getSelectKeys,
  getBdTranslateConfig,
  getParamPosition,
  checkEnableI18n,
  checkI18nExists,
};
