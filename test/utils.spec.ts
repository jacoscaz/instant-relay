
import { forEach } from '../src/utils';
import { strictEqual } from 'assert';

describe('utils', () => {
  describe('forEach()', () => {
    it('should loop through all items in a map', (testDone) => {
      let tot = 0;
      const map = new Map<string, number>();
      map.set('a', 5);
      map.set('b', 12);
      forEach(
        map,
        (item, next) => {
          tot += item;
          next();
        },
        () => {
          strictEqual(tot, 17);
          testDone();
        },
      );
    });
  });
});
