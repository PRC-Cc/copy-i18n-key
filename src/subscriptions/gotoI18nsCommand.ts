import { Range, TextEditor, Uri, commands, window, workspace } from "vscode";
import { COMMAND_KEYS, I18N_KEYS } from "../constants";
import { getParamPosition } from "../utils";

const fs = require("node:fs");

const gotoI18nPosition = (
  document: TextEditor,
  i18nKey: TI18nKey,
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