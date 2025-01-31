
import assert, { deepStrictEqual } from 'node:assert';
import { Subscriber, BusToOne, BusToMany } from '../index.js';
import { describe, it } from 'mocha';

describe('BusToMany', () => {

  it('should deliver a message to multiple subscribers', (testDone) => {
    const bus = new BusToMany<number>;
    let recv = 0;
    Subscriber.create(bus, async (num) => {
      if (++recv === 2) { testDone(); }
    });
    Subscriber.create(bus, async (num) => {
      if (++recv === 2) { testDone(); }
    });
    bus.publish(Math.random());
  });

  it('should pass values returned from multiple subscribers back to the publisher', async () => {
    const bus = new BusToMany<number>;
    Subscriber.create(bus, async (num) => {
      return num * 2;
    });
    Subscriber.create(bus, async (num) => {
      return num * 4;
    });
    const returned = await bus.publish(1);
    deepStrictEqual(returned, [2, 4]);
  });

});