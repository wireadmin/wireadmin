import { IPV4_REGEX } from "@/lib/constants";

export function isValidIPv4(str: string): boolean {
  return IPV4_REGEX.test(str);
}

export function isBetween(v: any, n1: number, n2: number): boolean {
  if (Number.isNaN(v)) {
    return false
  }
  const n = Number(v)
  return n1 <= n && n >= n2
}

export function isJson(str: string | object): boolean {
  if (typeof str === 'object' && isObject(str)) {
    return true;
  }
  try {
    return typeof str === 'string' && JSON.parse(str);
  } catch (ex) {
    return false;
  }
}

export function isObject(obj: object) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * Private IP Address Identifier in Regular Expression
 *
 * 127.  0.0.0 – 127.255.255.255     127.0.0.0 /8
 *  10.  0.0.0 –  10.255.255.255      10.0.0.0 /8
 * 172. 16.0.0 – 172. 31.255.255    172.16.0.0 /12
 * 192.168.0.0 – 192.168.255.255   192.168.0.0 /16
 */
export function isPrivateIP(ip: string) {
  const ipRegex = /^(127\.)|(10\.)|(172\.1[6-9]\.)|(172\.2[0-9]\.)|(172\.3[0-1]\.)|(192\.168\.)/
  return ipRegex.test(ip)
}
