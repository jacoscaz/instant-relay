
export const isNode = typeof process !== 'undefined'
  && process?.release?.name === 'node';

export const crashWithError = (err: Error) => {
  if (isNode) {
    console.error(err);
    process.exit(1);
  }
  throw err;
};

export const wait = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

export const RESOLVED = Promise.resolve();

export const asyncNoop = () => RESOLVED;

export const EMPTY_OBJ = Object.freeze(Object.create(null));
