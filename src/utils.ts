
export const EMPTY_OBJ = Object.freeze(Object.create(null));

export const RESOLVED = Promise.resolve();

export const noop = () => {};

export const noopAsync = () => RESOLVED;
