// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import baseTranslateCommand from "./subscriptions/baseTranslateCommand";
import copyCommand from "./subscriptions/copyI18nKeyCommand";
import gotoI18nJsonProvider from "./subscriptions/gotoI18nJsonProvider";
import gotoI18nsCommand from "./subscriptions/gotoI18nsCommand";
import reloadTranslateCommand from "./subscriptions/reloadTranslateCommand";
import { checkEnableI18n, configTranlateEnv } from "./utils";

export function activate(context: vscode.ExtensionContext) {
  configTranlateEnv();
  const copyDisposable = copyCommand();
  const translateDisposable = baseTranslateCommand(context);
  const reloadTranslateDisposable = reloadTranslateCommand();
  checkEnableI18n();
  const gotoI18nDisposables = gotoI18nsCommand();
  const gotoI18nJsonDisposable = gotoI18nJsonProvider();

  context.subscriptions.push(
    copyDisposable,
    translateDisposable,
    reloadTranslateDisposable,
    gotoI18nJsonDisposable,
    ...gotoI18nDisposables
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
