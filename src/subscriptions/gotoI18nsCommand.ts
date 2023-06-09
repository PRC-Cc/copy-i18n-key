import { Range, TextEditor, Uri, commands, window, workspace } from "vscode";
import { COMMAND_KEYS, I18N_KEYS } from "../constants";
import { checkEnableI18n, checkI18nExists, getParamPosition } from "../utils";

const fs = require("node:fs");

const gotoI18nPosition = (document: TextEditor, i18nKey: TI18nKey) => {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  const text = editor.document.getText?.(document.selection);
  if (!text) {
    return;
  }
  const { isExists, path } = checkI18nExists(i18nKey, editor.document.fileName);
  if (!isExists) {
    window.showWarningMessage(`${i18nKey} 文件不存在`);
    checkEnableI18n();
    return;
  }
  const targetFileStr = fs.readFileSync(path, "utf-8") as string;
  const targetPosition = getParamPosition(targetFileStr, text.split("."));
  if (!targetPosition) {
    window.showWarningMessage("未找到跳转位置");
    return;
  }
  workspace.openTextDocument(Uri.file(path)).then((document) => {
    window.showTextDocument(document, {
      selection: new Range(targetPosition, targetPosition),
    });
  });
};

export default () => {
  return I18N_KEYS.map((item) =>
    commands.registerTextEditorCommand(
      `${COMMAND_KEYS.gotoI18n_}${item}`,
      (document) => {
        gotoI18nPosition(document, item);
      }
    )
  );
};
