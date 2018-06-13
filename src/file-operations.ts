"use strict";

import * as vscode from "vscode";
import { dirname, join, isAbsolute, parse, relative } from "path";
import { existsSync, statSync } from "fs";
import { JsConfig } from "./jsconfig";
import * as mm from "micromatch";

export class FileOperations {
  private static getAbsoluteFromRelativePath(
    iPath: string,
    iCurrPath: string
  ): string {
    if (
      iPath === undefined ||
      iPath === "" ||
      iCurrPath === undefined ||
      iCurrPath === ""
    )
      return "";

    try {
      if (isAbsolute(iPath)) return join(iPath);
      if (statSync(iCurrPath).isFile) {
        iCurrPath = dirname(iCurrPath);
      }

      return join(iCurrPath, iPath);
    } catch (error) {
      return "";
    }
  }

  // cases to deal with:
  // import './foo' where missing extension.
  // - try .js, .jsx, .scss, .css (in this order?)
  // path has no ./
  // - import 'frontend/lib/foo' where jsconfig.json has paths defined
  // - or we could use babelrc aliases?
  // - import 'some-node-module' in which case, we don't do anything
  public static getPathToFile(
    wordPath: string,
    currentEditorFile: string,
    jsConfig?: JsConfig
  ): Thenable<vscode.Uri[]> {
    if (
      wordPath === undefined ||
      wordPath === "" ||
      currentEditorFile === undefined ||
      currentEditorFile === ""
    ) {
      return Promise.resolve([]);
    }

    // get the current workspace
    const pathUri = vscode.Uri.file(currentEditorFile);
    const currentWorkSpace = vscode.workspace.getWorkspaceFolder(pathUri);

    if (!currentWorkSpace) {
      return Promise.resolve([]);
    }

    // TODO: this doesn't feel like it would work on Windows...
    const pathIsRelative = wordPath.indexOf("./") > -1;

    if (pathIsRelative) {
      return this.findPathForRelativeFile(wordPath, currentEditorFile);
    } else {
      const haveJsConfigToTest = jsConfig && jsConfig.compilerOptions.paths;

      if (haveJsConfigToTest) {
        const matchingKey = Object.keys(
          jsConfig!.compilerOptions.paths || {}
        ).find((p: string) => {
          return mm.isMatch(wordPath, p) === true;
        });
        if (matchingKey) {
          return this.matchFromJsConfigPaths(
            wordPath,
            currentEditorFile,
            currentWorkSpace,
            matchingKey,
            jsConfig!
          );
        }
      }

      // if we don't have a jsconfig, we can make a reasonable guess...

      const fileAsRelativePath = vscode.workspace.asRelativePath(wordPath);

      const relativePatternForGlob = new vscode.RelativePattern(
        currentWorkSpace,
        `${fileAsRelativePath}*`
      );

      console.log(
        "got current workspace",
        currentWorkSpace.uri.fsPath,
        fileAsRelativePath
      );

      return vscode.workspace
        .findFiles(relativePatternForGlob, null, 5)
        .then(results => {
          return results.filter(r => r.fsPath !== currentEditorFile);
        });
    }
  }

  private static matchFromJsConfigPaths(
    wordPath: string,
    currentEditorFile: string,
    currentWorkSpace: vscode.WorkspaceFolder,
    matchingPathKey: string,
    jsConfig: JsConfig
  ): Thenable<vscode.Uri[]> {
    console.log("got import matching jsconfig path", wordPath, matchingPathKey);

    const potentialPaths = jsConfig.compilerOptions.paths![matchingPathKey];
    console.log("potentialpaths", potentialPaths);

    Promise.all(
      potentialPaths.map(potentialPath => {
        const matchedFromGlob = mm.capture(matchingPathKey, wordPath);

        if (!matchedFromGlob) return Promise.resolve([]);

        const newPotentialPath = potentialPath
          .replace("./", "")
          .replace("*", matchedFromGlob[0]);
        console.log("new potential path", newPotentialPath);

        const relativePatternForGlob = new vscode.RelativePattern(
          currentWorkSpace,
          `${newPotentialPath}*`
        );
        console.log("got relative pattern for glob", relativePatternForGlob);

        return vscode.workspace
          .findFiles(relativePatternForGlob, null, 5)
          .then(results => {
            return results.filter(r => r.fsPath !== currentEditorFile);
          });
      })
    ).then((responses: vscode.Uri[][]) => {
      console.log("got responses", responses);
    });

    return Promise.resolve([]);
  }

  private static findPathForRelativeFile(
    wordPath: string,
    currentEditorFile: string
  ): Thenable<vscode.Uri[]> {
    const hasExt = parse(wordPath).ext !== "";

    if (hasExt) {
      return Promise.resolve([
        vscode.Uri.file(
          this.getAbsoluteFromRelativePath(wordPath, currentEditorFile)
        )
      ]);
    }

    const relativePatternForGlob = new vscode.RelativePattern(
      dirname(currentEditorFile),
      `${wordPath.replace("./", "")}*`
    );

    return vscode.workspace
      .findFiles(relativePatternForGlob, null, 5)
      .then(results => {
        return results.filter(r => r.fsPath !== currentEditorFile);
      });
  }
}
