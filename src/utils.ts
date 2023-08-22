
export const crashWithError = (err: Error) => {
  console.error(err);
  process.exit(1);
};

export const wait = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};
