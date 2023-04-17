import { commands } from "vscode";
import { COMMAND_KEYS, I18N_KEYS } from "../constants";
import { checkEnableI18n } from "../utils";

export default () => {
  return commands.registerTextEditorCommand(COMMAND_KEYS.reloadI18nGoto, () => {
    checkEnableI18n();
  });
};
