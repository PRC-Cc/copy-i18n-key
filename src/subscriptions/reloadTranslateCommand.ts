import { commands } from "vscode";
import { configTranlateEnv } from "../utils";
import { COMMAND_KEYS } from "../constants";

export default () => {
  return commands.registerCommand(COMMAND_KEYS.reloadTranslate, () => {
    configTranlateEnv();
  });
};
