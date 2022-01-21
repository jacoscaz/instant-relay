
import { Callback } from './types';

export const crashWithError = (err: Error) => {
  console.error(err);
  process.exit(1);
};

export const forEach = <T>(items: Map<string, T>, iterator: (item: T, next: Callback) => any, done: Callback) => {
  let size = items.size;
  if (size === 0) {
    done();
    return;
  }
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
    size -= 1;
    if (size === 0) {
      returned = true;
      done();
    }
  };
  items.forEach((item: T) => iterator(item, next));
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
