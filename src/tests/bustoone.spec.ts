
import { deepStrictEqual } from 'node:assert';
import { Subscriber, BusToOne } from '../index.js';
import { describe, it } from 'mocha';

describe('BusToOne', () => {

  it('should deliver a message to one subscriber', (testDone) => {
    const bus = new BusToOne<number>();
    Subscriber.create(bus, async (num) => {
      testDone();
    });
    Subscriber.create(bus, async (num) => {
      testDone();
    });
    bus.publish(Math.random());
  });

  describe('using selector: FirstSelector', () => {

    it('should pass values returned from the first subscriber back to the publisher', async () => {
      const bus = new BusToOne<number>({ selector: new BusToOne.FirstSelector() });
      Subscriber.create(bus, async (num) => {
        return num * 2;
      });
      Subscriber.create(bus, async (num) => {
        return num * 4;
      });
      const returned = await bus.publish(1);
      deepStrictEqual(returned, 2);
    });

  });

  describe('using selector: RoundRobinSelector', () => {

    it('should pass values returned from subscribers in round-robin order', async () => {
      const bus = new BusToOne<number>({ selector: new BusToOne.RoundRobinSelector() });
      Subscriber.create(bus, async (num) => {
        return num * 2;
      });
      Subscriber.create(bus, async (num) => {
        return num * 4;
      });
      deepStrictEqual(await bus.publish(1), 2);
      deepStrictEqual(await bus.publish(1), 4);
      deepStrictEqual(await bus.publish(1), 2);
    });

  });

});