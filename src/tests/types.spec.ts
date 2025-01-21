
import { Bus } from '../index.js';
import { describe, it } from 'mocha';

describe('types', () => {

  describe('new Bus()', () => {

    it('inference of message type based on the provided transform function', () => {
      const bus = new Bus({ transform: (input: number) => `${input}` });
      const t1: typeof bus extends Bus<number, string> ? true : false = true;
      const t2: typeof bus extends Bus<string, number> ? true : false = false;
    });

    it('detect type conflict between divergent generic parameters and transform function', () => {
      // @ts-expect-error
      const bus = new Bus<string, number>({ transform: (input: number) => `${input}` });
    });

  });

});