# vscode-go-to-file

A plugin that aims to replicate some of Vim's "go to file" (`gf`) functionality.

A huge amount of credit goes to [fr43nk/seito-openfile](https://github.com/fr43nk/seito-openfile), whose plugin I used for the base of my work. I preferred to build my version as a standalone plugin in order to give me a plugin to work with as I learn more of the VSCode extension API.

Install from the VSCode market place: https://marketplace.visualstudio.com/items?itemName=jackfranklin.vscode-go-to-file

## Features

When your cursor is hovering over a file path, invoke this plugin to be taken to that file. For example, given this code:

```js
import foo from "./foo";
```

If your cursor is over the `'./foo'` string, you will be taken to the file.

When an extension is missing, the plugin will attempt to try `.js`, `.jsx`, `.scss` and `.css` by default.

This plugin will also attempt to parse a `jsconfig.json` if it exists in order to find the file, so it should be able to parse aliases. For example, with these paths in `jsconfig.json`:

```js
"paths": {
  "frontend/*": ["./frontend/*"],
  "testing/*": ["./src/testing/*"]
},
```

And an import of:

```js
import foo from "frontend/foo";
```

Invoking this plugin will take you to `frontend/foo.js` correctly. If not, please raise an issue!

## Requirements

By default this package does not bind to a key command. You should bind your own key to the command `vscodeGoToFile.goToFile`.

## Release Notes

### 0.0.1

Initial release.
