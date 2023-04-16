// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import baseTranslateCommand from "./subscriptions/translateCommand";
import copyCommand from "./subscriptions/copyI18nKeyCommand";
import gotoI18nJsonProvider from "./subscriptions/gotoI18nJsonProvider";
import gotoI18nsCommand from "./subscriptions/gotoI18nsCommand";
import { checkEnableI18n } from "./utils";

export function activate(context: vscode.ExtensionContext) {
  const copyDisposable = copyCommand();
  const translateDisposable = baseTranslateCommand(context);
  checkEnableI18n();
  const gotoI18nDisposables = gotoI18nsCommand();
  const gotoI18nJsonDisposable = gotoI18nJsonProvider();

  context.subscriptions.push(
    copyDisposable,
    translateDisposable,
    gotoI18nJsonDisposable,
    ...gotoI18nDisposables
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
