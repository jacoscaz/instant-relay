
export const isNode = typeof process !== 'undefined'
  && process?.release?.name === 'node';

export const crashIfError = (err?: Error | null | undefined) => {
  if (err) {
    if (isNode) {
      console.error(err);
      process.exit(1);
    }
    throw err;
  }
};

export const EMPTY_OBJ = Object.freeze(Object.create(null));

export const RESOLVED = Promise.resolve();

export const noop = () => {};

export const noopAsync = () => RESOLVED;
