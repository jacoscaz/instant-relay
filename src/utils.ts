
const isNode = typeof process !== 'undefined'
  && process?.release?.name === 'node';

export const crashWithError = (err: Error) => {
  console.error(err);
  if (isNode) {
    process.exit(1);
  }
};

export const wait = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};
