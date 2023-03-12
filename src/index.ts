import { copyProperties, getNewProperties, getObjectFirstValue, isNumber, strToUrl } from "./utils";

let windowProperties: Record<string, true>;

/**
 * 创建或复用 iframe
 * @param name iframe 名称，应全局唯一
 */
function createIframe(name: string) {
  let iframe: HTMLIFrameElement = document.querySelector(`iframe[name="${name}"]`)!
  if (iframe === null) {
    iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'about:blank');
    iframe.setAttribute('title', name);
    iframe.style['display'] = 'none';

    window.document.body.appendChild(iframe)
  }

  function remove() {
    return window.document.body.removeChild(iframe)
  }

  return {
    iframe,
    remove,
  }
}


// 记录 iframe 中的原始 window 的 keys，方便后续做比较
function recordOriginalWindowKeys(iframeWindow: Window) {
  if (windowProperties === undefined) {
    windowProperties = Object.create(null);
    copyProperties(windowProperties, iframeWindow)
  }
}

interface RunScriptInIframeOptions {
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

// 在 iframe 中执行 script
function runScriptInIframe<T = any>(options: RunScriptInIframeOptions) {
  const { name = options.url, url, autoRejectAllGlobalProperties, injectGlobalProperties, destoryIframeAfterEval = true, umd, successCallack, errorCallback, processIframe } = options;

  const { iframe, remove } = createIframe(name);

  processIframe && processIframe(iframe)

  // 记录老的 window 变量
  recordOriginalWindowKeys(iframe.contentWindow!)

  // 往 iframe window 中注入属性
  function injectWindowProperty() {
    const injectObj = injectGlobalProperties || {};
    if (autoRejectAllGlobalProperties) {
      const otherProperties = getNewProperties(window, windowProperties)
      Object.assign(injectObj, otherProperties);
    }

    Object.keys(injectObj).filter(key => key !== 'event' && !isNumber(key)).forEach(key => {
      Object.defineProperty(iframe.contentWindow, key, {
        get() {
          return injectObj[key]
        }
      })
    })
  }
  injectWindowProperty()

  // 销毁
  function destory() {
    destoryIframeAfterEval && remove();
  }

  // 是否已经发生过错误
  let hasError = false;

  // 处理成功
  function handleSucces(resolve: (value: any) => void) {
    function getRes(obj: Record<any, any>) {
      if (umd) return getObjectFirstValue<T>(obj);
      return obj;
    }

    if (!hasError) {
      resolve(getRes(getNewProperties(iframe.contentWindow!, windowProperties)))

      // 执行回调
      if (successCallack) {
        // 使用 requestAnimationFrame 循环，判断是否有新属性的添加
        let oldWindowProperties = windowProperties;
        // 是否终止
        let isContinue: boolean | void = true;
        function workLoop() {
          if (hasError || !isContinue) return;

          const newProperties = getNewProperties(iframe.contentWindow!, oldWindowProperties);
          if (Object.keys(newProperties).length) {
            copyProperties(oldWindowProperties, newProperties)
            isContinue = successCallack!(getRes(newProperties))
            if (!isContinue) {
              destory()
            }
          }
          requestAnimationFrame(workLoop)
        }

        requestAnimationFrame(workLoop)
      } else {
        destory()
      }
    }
  }

  // 处理失败
  function handleError(reject: (error: Error) => void, error: Error) {
    hasError = true;
    reject(error)
    if (errorCallback) {
      errorCallback(error)
    } else {
      destory()
    }
  }

  // 执行并返回
  return new Promise<T>((resolve, reject) => {
    const script = document.createElement('script')
    script.setAttribute('src', url)

    // 执行过程中发生错误
    window.addEventListener('error', (evt) => {
      handleError(reject, evt.error)
    })

    // 加载成功
    script.onload = () => {
      handleSucces(resolve)
    }

    // 链接加载失败
    script.onerror = (_event: Event | string, _source?: string, _lineno?: number, _colno?: number, error?: Error) => {
      handleError(reject, error!)
    };

    // 添加到 iframe 里面
    iframe.contentDocument!.body.appendChild(script);
  })
}

interface SafeEvalCodeOptions extends Partial<Omit<RunScriptInIframeOptions, 'url'>> {
  // 代码
  code: string;
}

// 安全的执行代码
export function safeEvalCode(options: SafeEvalCodeOptions) {
  const { code, ...rest } = options;

  return runScriptInIframe({
    url: strToUrl(code),
    ...rest
  })
}

// 重新导出换个名字
export const safeLoadScript = runScriptInIframe;
