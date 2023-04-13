import clipboard from "clipboardy";
import { commands, window } from "vscode";
import { getSelectKeys } from "../utils";
import { COMMAND_KEYS } from "../constants";

export default () => {
  return commands.registerCommand(COMMAND_KEYS.copyI18nKey, () => {
    const keys = getSelectKeys();
    if (!keys) {
      return;
    }
    clipboard.writeSync(keys.join("."));
    window.showInformationMessage(`i18n key复制成功：${keys.join(".")}`);
  });
};
