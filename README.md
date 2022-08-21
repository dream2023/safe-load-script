# safe-load-script

动态加载 JS 脚本，几乎 100% 安全执行。

[English](./README-en.md)

## 安全性实现原理

目前社区针对第三方 JS 的不受信执行，基本都是采用拦截或者代理的方式，但这种方式并不安全。例如虽然拦截了 window 全局变量，还能操作 DOM，还能修改内置对象的原型链，总之这种方式是防君子，难防小人。

但浏览器本身就有一个完美的沙箱，即 `iframe`。我们通过动态创建一个 `iframe`，并将 JS 放到 `iframe` 中执行，然后将执行结果（挂载到 window 的变量），返回给主应用，最后将 `iframe` 删除，就几乎完美的达到了沙箱的能力。

这里之所以说几乎，是因为我们有时还需要注入一些第三方 JS 的依赖变量，例如我们需要给第三方 React 组件注入 React、ReactDOM，这些仍然有可乘之机。

## Feature

- JS 运行在 iframe 中运行，几乎 100% 安全执行。
- 支持内联代码块和外部链接。
- 支持 UMD 模块，并且相对于 `systemjs` 等库，不会污染全局变量。

## Installation

```bash
yarn add safe-load-script # or npm install safe-load-script -S
```

## Example Usage

加载一个 umd 模块链接示例。

```js
import { safeLoadScript } from "safeLoadScript";

async function main() {
  const React = await safeLoadScript({
    url: "https://unpkg.com/react/umd/react.production.min.js",
    umd: true, // 上面的链接实际是一个 UMD 格式模块
  });
}

main();
```

> PS：UMD 加载和非 UMD 加载区别其实很简单，我们以上面为例，这个连接最终会在 window 上挂一个 React 全局变量，如果是 `umd` 为 true 的情况下，返回的就是 `React` 对象，如果为 false 或者不填，则返回的是 { React } 对象。

执行内联 JS 代码示例。

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

在加载一些链接时，需要注入相应的依赖，例如 UMD 的 React 组件是依赖 React、ReactDOM。想要做到这个能力有两种方式：

- `autoRejectAllGlobalProperties` 自动注入
- `injectGlobalProperties` 手动注入

```js
import React from "react";
import ReactDOM from "react-dom/client";
import { safeLoadScript } from "safeLoadScript";

// 自动注入的方式
window.React = React;
window.ReactDOM = ReactDOM;

const antd = await safeLoadScript({
  url: "https://unpkg.com/browse/antd/dist/antd.min.js",
  umd: true,
  autoRejectAllGlobalProperties: true, // 自动注入
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
    // 手动注入
    React,
    ReactDOM,
  },
});
```

某些场景下并不是立即挂载到全局变量上，此时我们可以使用回调函数的形式获取值。

```js
import { safeEvalCode } from "safeEvalCode";

safeEvalCode({
  code: `
    // 代码执行完了，但是异步函数里做了操作
    setTimeout(() => {
      window.foo = 'foo';
    }, 1000)
  `,
  successCallack({ foo }) {
    console.log(foo);
  },
});
```

如果我们想要一直监听 JS 里面的执行，而不是执行完就销毁，我们可以在 `successCallback` 返回 `true` 即可。

## API

```ts
interface Options {
  // 链接
  url: string;
  // 是否以 umd 的方式获取结果
  umd?: boolean;
  // 唯一标识，用于复用 iframe
  name?: string;
  // 自定义处理 iframe
  processIframe?: (iframe: HTMLIFrameElement) => void;
  // 成功回调，当返回为 `true` 时，继续监听
  successCallack?: (newProperties: Record<string, any>) => boolean | void;
  // 错误回调
  errorCallback?: (error: Error) => void;
  // 是否在执行后立即销毁 iframe
  destoryIframeAfterEval?: boolean;
  // 是否自动注入主应用的所有的全局变量
  autoRejectAllGlobalProperties?: boolean;
  // 指定注入的全局变量
  injectGlobalProperties?: Record<string, any>
}
```
