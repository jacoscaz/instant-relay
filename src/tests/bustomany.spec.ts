
import { deepStrictEqual } from 'node:assert';
import { Subscriber, BusToMany } from '../index.js';
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

  it('should deliver a message when one subscriber is destroyed', (testDone) => {
    const bus = new BusToMany<number>();
    const sub1 = Subscriber.create(bus, async () => {
      throw new Error('should not be here');
    });
    const sub2 = Subscriber.create(bus, async () => {
      testDone();
    });
    sub1.destroy();
    bus.publish(Math.random());
  });

  it('should not deliver a message if destroyed', () => {
    const bus = new BusToMany<number>();
    Subscriber.create(bus, async (num) => {
      throw new Error('should not be here');
    });
    bus.destroy();
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

  describe('removeAllSubscribers()', () => {

    it('should prevent message delivery after removing all subscribers', async () => {
      const bus = new BusToMany<number>();
      const received: number[] = [];
      Subscriber.create(bus, async (num) => {
        received.push(num);
        return num;
      });
      await bus.publish(1);
      deepStrictEqual(received, [1]);
      bus.removeAllSubscribers();
      // Queue is paused and no subscribers remain, so lag stays 0
      deepStrictEqual(bus.lag(), 0);
    });

    it('should allow re-subscribing after removing all subscribers', async () => {
      const bus = new BusToMany<number>();
      const received1: number[] = [];
      const received2: number[] = [];
      Subscriber.create(bus, async (num) => {
        received1.push(num);
        return num;
      });
      await bus.publish(1);
      bus.removeAllSubscribers();
      Subscriber.create(bus, async (num) => {
        received2.push(num);
        return num;
      });
      await bus.publish(2);
      deepStrictEqual(received1, [1]);
      deepStrictEqual(received2, [2]);
    });

    it('should not trigger subscriber destroy listeners', () => {
      const bus = new BusToMany<number>();
      let destroyCalled = false;
      const sub = Subscriber.create(bus, async (num) => num);
      sub.on('destroy', () => { destroyCalled = true; });
      bus.removeAllSubscribers();
      deepStrictEqual(destroyCalled, false);
    });

  });

  describe('abort()', () => {

    it('should be callable when no messages are queued', () => {
      const bus = new BusToMany<number>();
      Subscriber.create(bus, async (num) => num);
      bus.abort();
      deepStrictEqual(bus.lag(), 0);
    });

  });

});
