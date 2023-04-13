import { Location, Position, TextDocument, Uri, languages } from "vscode";
import { I18N_KEYS } from "../constants";
import { getParamPosition, getSelectKeys } from "../utils";

const fs = require("node:fs");

function gotoI18nJson(document: TextDocument, position: Position): any {
  const keys = getSelectKeys();
  if (!keys) {
    return;
  }

  const rs = document.fileName.match(/^(.*\/)(.*)\.json$/);
  if (!rs) {
    return;
  }
  const [, prefix, currentKey] = rs;
  const otherKeys = I18N_KEYS.filter((item) => item !== currentKey);
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

export default () => {
  return languages.registerDefinitionProvider(["json"], {
    provideDefinition: gotoI18nJson,
  });
};
