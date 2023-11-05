import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { IPV4_REGEX } from '$lib/constants';

export function isValidIPv4(str: string): boolean {
  return IPV4_REGEX.test(str);
}

export function isBetween(v: any, n1: number, n2: number): boolean {
  if (Number.isNaN(v)) {
    return false;
  }
  const n = Number(v);
  return n1 <= n && n >= n2;
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
  const ipRegex = /^(127\.)|(10\.)|(172\.1[6-9]\.)|(172\.2[0-9]\.)|(172\.3[0-1]\.)|(192\.168\.)/;
  return ipRegex.test(ip);
}

export function dynaJoin(lines: (string | 0 | null | undefined)[]): string[] {
  return lines.filter((d) => typeof d === 'string') as string[];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 },
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (style: Record<string, number | string | undefined>): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, '');
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t,
      });
    },
    easing: cubicOut,
  };
};
