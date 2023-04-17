import { PluginItem, transformSync } from "@babel/core";
import * as fs from "fs";
import { Range, Uri, ViewColumn, window, workspace } from "vscode";
import { checkEnableI18n, checkI18nExists, getParamPosition } from ".";

/**
 * 检查json是否冲突
 * @param data json 对象
 * @param key 格式：a.b.c
 * @returns
 */
function checkIsValid(data: Record<string, any>, key: string) {
  const keys = key.split(".");
  let temp = data;
  let isValid = true;
  const findKeys = [];
  while (true) {
    if (keys.length === 0) {
      break;
    }
    const current = temp[keys[0]];
    if (current === undefined) {
      break;
    }
    if (
      Object.prototype.toString.call(current) === "[object Object]" &&
      keys.length >= 2
    ) {
      findKeys.push(keys.shift());
      temp = current;
    } else {
      findKeys.push(keys.shift());
      isValid = false;
      break;
    }
  }
  return { isValid, findKeys };
}

const tranformPluginGenerator: (key: string, value: string) => PluginItem = (
  key,
  value
) => {
  return (babel) => {
    const { types } = babel;
    const keys = key.split(".");

    let level = 0;
    let index = 0;
    let done = false;

    const add = (path: any) => {
      if (done) {
        return;
      }
      const restAppendKeys = keys.slice(index);
      if (path.node.type === "ObjectExpression") {
        if (restAppendKeys.length === 1) {
          path.node.properties.push(
            types.objectProperty(
              types.identifier(`"${restAppendKeys[0]}"`),
              types.stringLiteral(value)
            )
          );
        } else {
          const rootKey = restAppendKeys[0];
          const val = restAppendKeys
            .slice(1)
            .reverse()
            .reduce((_: any, now: any) => {
              return types.objectExpression([
                types.objectProperty(types.identifier(`"${now}"`), _),
              ]);
            }, types.stringLiteral(value));

          path.node.properties.push(
            types.objectProperty(types.identifier(`"${rootKey}"`), val)
          );
        }

        done = true;
      }
    };

    return {
      visitor: {
        ObjectExpression: {
          enter(path: any) {
            if (path.node.properties.length === 0 && level === 0) {
              add(path);
            }
            level += 1;
          },
          exit(path: any) {
            level -= 1;
            if (level - 1 < index) {
              add(path);
            }
          },
        },
        ObjectProperty: {
          enter(path: any) {
            if (index === level - 1) {
              if (path.node.key.value === keys[index]) {
                index++;
              }
            }
          },
          exit() {},
        },
      },
    };
  };
};

function parse(str: string, i18nKey: TI18nKey, key: string, value: string) {
  try {
    const rs = transformSync(`let a = ${str}`, {
      plugins: [tranformPluginGenerator(key, value)],
      generatorOpts: {
        jsescOption: {
          minimal: true,
        },
      },
    });
    if (!rs?.code) {
      window.showErrorMessage(`转换失败，请检查 ${i18nKey} 文件`);
      return { success: false, code: "" };
    }
    return {
      success: true,
      code: rs.code.replace(/^let\sa\s=\s/, "").replace(/;$/, ""),
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      success: false,
      code: "",
    };
  }
}

function jump(path: string, key: string) {
  const targetFileStr = fs.readFileSync(path, "utf-8") as string;
  const targetPosition = getParamPosition(targetFileStr, key.split("."));
  if (!targetPosition) {
    window.showWarningMessage("未找到跳转位置");
    return;
  }
  workspace.openTextDocument(Uri.file(path)).then((document) => {
    window.showTextDocument(document, {
      viewColumn: ViewColumn.One,
    });
    // 延迟
    setTimeout(() => {
      window.showTextDocument(document, {
        selection: new Range(targetPosition, targetPosition),
        viewColumn: ViewColumn.One,
      });
    }, 200);
  });
}

export function transform(i18nKey: TI18nKey, key: string, value: string) {
  const { isExists, path: i18nPath } = checkI18nExists(i18nKey);
  // 不存在，新建
  if (!isExists) {
    const { success, code } = parse("{}", i18nKey, key, value);
    if (success) {
      try {
        fs.writeFileSync(i18nPath, code, {
          encoding: "utf-8",
        });
        window.showInformationMessage("新增成功");
        checkEnableI18n();
        jump(i18nPath, key);
      } catch (error) {
        window.showErrorMessage(`写入${i18nKey}文件失败`);
      }
    }
    return;
  }

  // 存在，修改
  let targetFileStr = fs.readFileSync(i18nPath, "utf-8") as string;
  if (/^[\s\n\r]*$/.test(targetFileStr)) {
    targetFileStr = "{}";
  }
  let targetFileJson;
  try {
    targetFileJson = JSON.parse(targetFileStr);
    if (Object.prototype.toString.call(targetFileJson) !== "[object Object]") {
      throw new Error("not Object");
    }
  } catch (error) {
    window.showWarningMessage(`${i18nKey} 数据格式错误，请检测`);
    return;
  }
  const { isValid, findKeys } = checkIsValid(targetFileJson, key);
  if (!isValid) {
    window.showWarningMessage(`${i18nKey} 数据格式冲突，请检测`);
    jump(i18nPath, findKeys.join("."));
    return;
  }

  // 新增操作

  const { success, code } = parse(targetFileStr, i18nKey, key, value);
  if (!success) {
    window.showWarningMessage(`${i18nKey} 数据格式错误，请检测`);
    return;
  }
  try {
    fs.writeFileSync(i18nPath, code, {
      encoding: "utf-8",
    });
    window.showInformationMessage("新增成功");
    jump(i18nPath, key);
  } catch (error) {
    window.showErrorMessage(`写入${i18nKey}文件失败`);
  }
}
