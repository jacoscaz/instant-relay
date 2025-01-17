
import assert, { strictEqual } from 'assert';
import { Subscriber, Bus } from '../index.js';

describe('topologies', () => {

  it('circular topology, two buses, blocking chain', function (testDone) {

    this.timeout(0);

    const a_to_b = new Bus<'atob'>();
    const b_to_a = new Bus<'btoa'>();

    Subscriber.create([a_to_b], async (message) => {
      await b_to_a.dispatch('btoa');
    });
    
    let recvd = 0;
    Subscriber.create([b_to_a], async (message) => {
      recvd += 1;
      if (recvd === 1_000_000) {
        testDone();
        return;
      }
      await a_to_b.dispatch('atob');
    });

    setImmediate(() => {
      b_to_a.dispatch('btoa');
    });

  });

  it('circular topology, three buses, blocking chain', function (testDone) {

    this.timeout(0);

    const a_to_b = new Bus<'atob'>();
    const b_to_c = new Bus<'btoc'>();
    const c_to_a = new Bus<'ctoa'>();

    Subscriber.create([a_to_b], async (message) => {
      await b_to_c.dispatch('btoc');
    });

    Subscriber.create([b_to_c], async (message) => {
      await c_to_a.dispatch('ctoa');
    });

    let recvd = 0;
    Subscriber.create([c_to_a], async (message) => {
      recvd += 1;
      if (recvd === 1_000_000) {
        testDone();
        return;
      }
      await a_to_b.dispatch('atob');
    });
    
    setImmediate(() => { a_to_b.dispatch('atob'); });

  });

});
