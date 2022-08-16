/**
 * 给定两个对象，获取新属性
 * @param newObj 新对象
 * @param oldObj 旧对象
 */
export function getNewProperties(newObj: Record<string, any>, oldObj: Record<string, any>) {
  const res: Record<string, any> = {};
  for (let key in newObj) {
    if (oldObj[key] === undefined) {
      res[key] = newObj[key];
    }
  }

  return res;
}

// 将字符串转为 url
export function strToUrl(str: string) {
  const blob = new Blob([str], {
    type: 'text/plain'
  })
  return URL.createObjectURL(blob)
}

// 拷贝属性
export function copyProperties(newObj: Record<string, true>, oldObj: Record<any, any>) {
  for (let key in oldObj) {
    newObj[key] = true;
  }
}

// 判断是否为数组
export function isNumber(val: string) {
 return String(Number(val)) === val
}

// 获取对象的第一个值
export function getObjectFirstValue<T = any>(obj: Record<any, any>): T {
  const keys = Object.keys(obj)
  return keys.length ? obj[keys[0]] : undefined;
}