import { IPV4_REGEX } from "@/lib/constants";

export function isValidIPv4(str: string): boolean {
  return IPV4_REGEX.test(str);
}

export function isBetween(v:any,n1:number,n2:number): boolean {
  if (Number.isNaN(v)){
    return false
  }
  const n = Number(v)
  return n1 <= n && n >= n2
}
