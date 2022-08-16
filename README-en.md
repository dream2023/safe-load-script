# safe-load-script

Dynamically load script and can be safely executed.

[中文](./README.md)

## Feature

- In iframe sandbox, code can be executed safely.
- Supports inline code blocks and external links.
- Support UMD module。

## Installation

```bash
yarn add safe-load-script
# or
npm install safe-load-script -S
```

## Example Usage

Load a UMD module.

```js
import { safeLoadScript } from "safeLoadScript";

async function main() {
  const React = await safeLoadScript({
    url: "https://unpkg.com/react/umd/react.production.min.js",
    umd: true, // this link a umd module
  });
}

main();
```

An example of executing an inline code block.

```js
import { safeEvalCode } from "safeEvalCode";

const { foo, bar } = await safeEvalCode({
  code: `
    window.foo = 'foo';
    window.bar = 'bar';
  `,
});
console.log(foo, bar);
```

Sometimes you need to inject dependencies. For example, the react component of UMD depends on react and react dom.There are two ways:

- `autoRejectAllGlobalProperties` Automatic injection
- `injectGlobalProperties` Manual injection

```js
import React from "react";
import ReactDOM from "react-dom/client";
import { safeLoadScript } from "safeLoadScript";

window.React = React;
window.ReactDOM = ReactDOM;

const antd = await safeLoadScript({
  url: "https://unpkg.com/browse/antd/dist/antd.min.js",
  umd: true,
  autoRejectAllGlobalProperties: true,
});
```

```js
import React from "react";
import ReactDOM from "react-dom/client";
import { safeLoadScript } from "safeLoadScript";

window.React = React;
window.ReactDOM = ReactDOM;

const antd = await safeLoadScript({
  url: "https://unpkg.com/browse/antd/dist/antd.min.js",
  umd: true,
  injectGlobalProperties: {
    React,
    ReactDOM,
  },
});
```

In some scenarios, it is asynchronous.

```js
import { safeEvalCode } from "safeEvalCode";

safeEvalCode({
  code: `
    setTimeout(() => {
      window.foo = 'foo';
    }, 1000)
  `,
  successCallack({ foo }) {
    console.log(foo);
  },
});
```

## API

```ts
interface Options {
  url: string;
  // umd mode
  umd?: boolean;
  // Unique identifier for multiplexing iframe
  name?: string;
  processIframe?: (iframe: HTMLIFrameElement) => void;
  successCallack?: (newProperties: Record<string, any>) => boolean | void;
  errorCallback?: (error: Error) => void;
  // Destroy iframe immediately after execution
  destoryIframeAfterEval?: boolean;
  autoRejectAllGlobalProperties?: boolean;
  injectGlobalProperties?: Record<string, any>
}
```

