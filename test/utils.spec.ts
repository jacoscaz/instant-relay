
import { forEach, uid } from '../src/utils';
import { strictEqual, notStrictEqual } from 'assert';

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

  describe('uid()', () => {
    it('should generate uids of given length', () => {
      const a = uid();
      const b = uid(20);
      const c = uid(30);
      notStrictEqual(a, b);
      notStrictEqual(b, c);
      notStrictEqual(c, a);
      strictEqual(b.length, 20);
      strictEqual(c.length, 30);
    });
  });

});
