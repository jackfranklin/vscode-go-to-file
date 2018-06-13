"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { TextOperations } from "./text-operations";
import { FileOperations } from "./file-operations";
import * as fs from "fs";
import * as path from "path";
import { JsConfig } from "./jsconfig";

const getWordRange = (
  editor: vscode.TextEditor,
  selection: vscode.Selection
) => {
  let line: string;
  let start: vscode.Position;
  if (editor.selection.isEmpty) {
    line = TextOperations.getCurrentLine(
      editor.document.getText(),
      selection.active.line
    );
    start = selection.active;
  } else {
    line = TextOperations.getCurrentLine(
      editor.document.getText(),
      selection.start.line
    );
    return TextOperations.getWordOfSelection(line, selection);
  }
  return TextOperations.getWordBetweenBounds(line, start);
};

const openDocument = (
  editor: vscode.TextEditor,
  iWord: string,
  jsConfig?: JsConfig
) => {
  if (iWord === undefined || iWord === "") return;

  const potentialPathsToFile = FileOperations.getPathToFile(
    iWord,
    editor.document.fileName,
    jsConfig
  );

  potentialPathsToFile.then((paths: vscode.Uri[]) => {
    // console.log("got paths", paths);
  });

  //   if (existsSync(p)) {
  //     vscode.workspace.openTextDocument(p).then(iDoc => {
  //       if (iDoc !== undefined) {
  //         vscode.window.showTextDocument(iDoc).then(iEditor => {
  //           if (fileAndLine.line !== -1) {
  //             let range = iEditor.document.lineAt(fileAndLine.line - 1).range;
  //             iEditor.selection = new vscode.Selection(range.start, range.end);
  //             iEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  //           }
  //         });
  //       }
  //     });
  //   }
};

const getJsConfig = (editor: vscode.TextEditor): JsConfig | undefined => {
  const pathUri = vscode.Uri.file(editor.document.fileName);
  const currentWorkSpace = vscode.workspace.getWorkspaceFolder(pathUri);

  if (!currentWorkSpace) return undefined;

  const jsConfigPath = path.join(currentWorkSpace.uri.fsPath, "jsconfig.json");

  try {
    const contents = fs.readFileSync(jsConfigPath, { encoding: "utf8" });
    return JSON.parse(contents);
  } catch (e) {
    return undefined;
  }
};

const execute = (editor?: vscode.TextEditor) => {
  if (!editor) return;
  const jsConfig = getJsConfig(editor);
  console.log("got js config", jsConfig);

  for (let i: number = 0; i < editor.selections.length; i++) {
    const word = getWordRange(editor, editor.selections[0]);
    openDocument(editor, word, jsConfig);
  }
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("extension.sayHello", () => {
    // The code you place here will be executed every time your command is executed

    execute(vscode.window.activeTextEditor);

    // Display a message box to the user
    // vscode.window.showInformationMessage("Hello World!");
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
