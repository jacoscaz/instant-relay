
import { Subscriber, BusToOne, BusToMany } from '../index.js';
import { describe, it } from 'mocha';

describe('inference of subscriber types', () => {

  it('should infer the message type of a single subscriber to BusToOne', () => {
    const bus = new BusToOne<number>();
    const sub = Subscriber.create(bus, async (message) => {
      const t1: typeof message extends number ? true : false = true;
      const t2: typeof message extends string ? true : false = false;
    });
    const t3: typeof sub extends Subscriber<number, any> ? true : false = true;
  });

  it('should infer the return type of a single subscriber to BusToOne', () => {
    const bus = new BusToOne<number, string>();
    // @ts-expect-error
    const sub1 = Subscriber.create(bus, async (message) => message);
    const sub2 = Subscriber.create(bus, async (message) => String(message));
    const t1: typeof sub2 extends Subscriber<number, string> ? true : false = true;
    const t2: typeof sub2 extends Subscriber<number, number> ? true : false = false;
  });

  it('should infer the message type of a single subscriber to BusToMany', () => {
    const bus = new BusToMany<number>();
    const sub = Subscriber.create(bus, async (message) => {
      const t1: typeof message extends number ? true : false = true;
      const t2: typeof message extends string ? true : false = false;
    });
    const t3: typeof sub extends Subscriber<number, any> ? true : false = true;
  });

  it('should infer the return type of a single subscriber to BusToMany', () => {
    const bus = new BusToMany<number, string>();
    // @ts-expect-error
    const sub1 = Subscriber.create(bus, async (message) => message);
    const sub2 = Subscriber.create(bus, async (message) => String(message));
    const t1: typeof sub2 extends Subscriber<number, string> ? true : false = true;
    const t2: typeof sub2 extends Subscriber<number, number> ? true : false = false;
  });

  it('should allow subscribing to buses with different message types', () => {
    const bus1 = new BusToMany<number, string>();
    const bus2 = new BusToMany<number, string>();
    const sub1 = Subscriber.create([bus1, bus2], async (message) => String(message));
  });

  it('should prevent subscribing to buses with different return types types', () => {
    const bus1 = new BusToMany<number, string>();
    const bus2 = new BusToMany<number, number>();
    // @ts-expect-error
    const sub1 = Subscriber.create([bus1, bus2], async (message) => String(message));
  });

});
