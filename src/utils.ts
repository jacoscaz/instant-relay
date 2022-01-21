
import { Callback } from './types';

export const crashWithError = (err: Error) => {
  console.error(err);
  process.exit(1);
};

export const forEach = <T>(items: T[] | Record<string, T>, iterator: (item: T, next: Callback) => any, done: Callback) => {
  if (items.length === 0) {
    done();
    return;
  }
  let count = 0;
  let returned = false;
  const next = (err: Error | null | undefined) => {
    if (returned) {
      return;
    }
    if (err) {
      returned = true;
      done(err);
      return;
    }
    count += 1;
    if (count === items.length) {
      returned = true;
      done();
    }
  };
  if (Array.isArray(items)) {
    for (let i = 0, l = items.length; i < l; i += 1) {
      iterator(items[i], next);
    }
  } else {
    for (const key in items) {
      if (Object.prototype.hasOwnProperty.call(items, key)) {
        iterator(items[key], next);
      }
    }
  }
};

/*
 * The following function was taken from https://github.com/lukeed/uid,
 * available on NPM as the "uid" package (MIT licensed).
 *
 * https://github.com/lukeed/uid/blob/6c52bbda31acb7f00f0bd8a8f2f606f96df762aa/src/single.js
 */
let IDX=36, HEX='';
while (IDX--) HEX += IDX.toString(36);

export const uid = (len?: number) => {
  let str='', num = len || 11;
  while (num--) str += HEX[Math.random() * 36 | 0];
  return str;
};
