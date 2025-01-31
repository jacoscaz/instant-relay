
import assert, { strictEqual } from 'assert';
import { Subscriber, BusToOne, BusToMany } from '../index.js';
import { describe, it } from 'mocha';

describe('topologies', () => {

  it('A -> BusToOne -> B', function (testDone) {

    const bus = new BusToOne<number>();

    let recvd = 0;

    Subscriber.create([bus], async (message) => {
      recvd += 1;
      if (recvd === 1_000_000) {
        bus.destroy();
        testDone();
      }
    });
    
    let sent = 0;

    const loop = () => {
      if (sent < 1_000_000) {
        bus.publish(sent++)
          .then(loop)
          .catch(testDone);
      }
    };

    loop();
  });

  it('A -> BusToMany -> B', function (testDone) {

    const bus = new BusToMany<number>();

    let recvd = 0;

    Subscriber.create([bus], async (message) => {
      recvd += 1;
      if (recvd === 1_000_000) {
        bus.destroy();
        testDone();
      }
    });
    
    let sent = 0;

    const loop = () => {
      if (sent < 1_000_000) {
        bus.publish(sent++)
          .then(loop)
          .catch(testDone);
      }
    };

    loop();
  });

  it('A -> BusToOne -> B with return values', function (testDone) {

    const bus = new BusToOne<number, string>();

    Subscriber.create([bus], async (message) => {
      return `${message}`;
    });
    
    let sent = 0;

    const loop = (str: string) => {
      if (str === '1000000') {
        testDone();
      } else {
        bus.publish(sent++)
          .then(loop)
          .catch(testDone);
      }
    };

    loop('');
  });

  it('A -> BusToMany -> B with return values', function (testDone) {

    const bus = new BusToMany<number, string>();

    Subscriber.create([bus], async (message) => {
      return `${message}`;
    });
    
    let sent = 0;

    const loop = (str: string[]) => {
      if (str[0] === '1000000') {
        testDone();
      } else {
        bus.publish(sent++)
          .then(loop)
          .catch(testDone);
      }
    };

    loop(['']);
  });

  
});
