
import assert, { strictEqual } from 'assert';
import { Subscriber, Bus } from '../index.js';
import { describe, it } from 'mocha';

describe('topologies', () => {

  it('circular topology, one bus, two subscribers, blocking chain', function (testDone) {

    this.timeout(0);

    const single_bus = new Bus<'a'|'b'>();

    Subscriber.create([single_bus], async (message) => {
      switch (message) {
        case 'b':
          await single_bus.publish('a');
      }
    });
    
    let recvd = 0;
    Subscriber.create([single_bus], async (message) => {
      if (message === 'a') {
        recvd += 1;
        if (recvd === 1_000_000) {
          testDone();
          return;
        }
        await single_bus.publish('b');
      }
    });

    setImmediate(() => {
      single_bus.publish('b');
    });

  });

  it('circular topology, two buses, two subscribers, blocking chain', function (testDone) {

    this.timeout(0);

    const a_to_b = new Bus<'atob'>();
    const b_to_a = new Bus<'btoa'>();

    Subscriber.create([a_to_b], async (message) => {
      await b_to_a.publish('btoa');
    });
    
    let recvd = 0;
    Subscriber.create([b_to_a], async (message) => {
      recvd += 1;
      if (recvd === 1_000_000) {
        testDone();
        return;
      }
      await a_to_b.publish('atob');
    });

    setImmediate(() => {
      b_to_a.publish('btoa');
    });

  });

  it('circular topology, three buses, three subscribers, blocking chain', function (testDone) {

    this.timeout(0);

    const a_to_b = new Bus<'atob'>();
    const b_to_c = new Bus<'btoc'>();
    const c_to_a = new Bus<'ctoa'>();

    Subscriber.create([a_to_b], async (message) => {
      await b_to_c.publish('btoc');
    });

    Subscriber.create([b_to_c], async (message) => {
      await c_to_a.publish('ctoa');
    });

    let recvd = 0;
    Subscriber.create([c_to_a], async (message) => {
      recvd += 1;
      if (recvd === 1_000_000) {
        testDone();
        return;
      }
      await a_to_b.publish('atob');
    });
    
    setImmediate(() => { a_to_b.publish('atob'); });

  });

});
