export function isObject(obj: object) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
