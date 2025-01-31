
import { deepStrictEqual } from 'node:assert';
import { Subscriber, BusToMany } from '../index.js';
import { describe, it } from 'mocha';

describe('Subscriber', () => {

  it('should not receive a message if destroyed', () => {
    const bus = new BusToMany<number>();
    const sub = Subscriber.create(bus, async () => {
      throw new Error('should not be here');
    });
    sub.destroy();
    bus.publish(Math.random());
  });

});