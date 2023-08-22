
import assert, { strictEqual } from 'assert';
import { InstantRelay } from './InstantRelay';
import { NodeFactory } from './types';

describe('instant-relay', () => {

  describe('send()', () => {

    it('should send a message to another node', (testDone) => {
      const ir = new InstantRelay();
      const msg = { id: '1', type: 'msg' };
      ir.addNode('a', (send, broadcast) => {
        setImmediate(() => {
          send('b', msg);
        });
        return async () => {};
      }, {});
      ir.addNode('b', (send, broadcast) => {
        return async (message) => {
          strictEqual(message, msg);
          testDone();
        };
      }, {});
    });

  });

  describe('broadcast()', () => {

    it('should broadcast a message from one node to another', (testDone) => {
      const ir = new InstantRelay();
      const msg = { id: '1', type: 'msg'};
      ir.addNode('a', (send, broadcast) => {
        setImmediate(() => {
          broadcast(msg);
        });
        return async () => {};
      }, {});
      ir.addNode('b', (send, broadcast) => {
        return async (message) => {
          strictEqual(message, msg, 'unexpected message');
          testDone();
        };
      }, {});
    });

    it('should broadcast a message to all other nodes', (testDone) => {
      const ir = new InstantRelay();
      let receivedCount = 0;
      const receiverQty = 3;
      const msg = { id: '1', type: 'msg'};
      const receiverFactory: NodeFactory<any, {}> = () => {
        return async (receivedMessage) => {
          strictEqual(msg, receivedMessage);
          receivedCount += 1;
          if (receivedCount >= receiverQty) {
            testDone();
          }
        };
      };
      for (let i = 0; i < receiverQty; i += 1) {
        ir.addNode(`receiver-${i}`, receiverFactory, {});
      }
      ir.addNode('broadcaster', (send, broadcast) => {
        setImmediate(() => {
          broadcast(msg);
        });
        return async () => {};
      }, {});
    });

  });

  describe('backpressure', () => {

    it('should throttle once the high-water mark is reached', (testDone) => {
      const ir = new InstantRelay();
      const opts = {
        concurrency: 1,
        highWaterMark: 3,
        throttle: (len: number) => {
          strictEqual(len, 3);
          testDone();
          return 0;
        },
      };
      ir.addNode('r', (send, broadcast) => {
        return (message) => new Promise(() => {});
      }, opts);
      for (let i = 0; i < 4; i += 1) {
        ir.nodeMap.get('r')!.queue.push({ id: i + '', type: 'msg' });
      }
    });

    it('throttling should result in higher latencies for pushers', (testDone) => {
      const ir = new InstantRelay();
      ir.addNode('r', (send, broadcast) => {
        return (message) => new Promise(() => {});
      }, { highWaterMark: 1, throttle: (len: number) => len * 5 });
      let prevTstmp = Date.now();
      let currTstmp = prevTstmp;
      let prevDelta = 0;
      let currDelta = 0;
      let count = 0;
      const loop = () => {
        ir.nodeMap.get('r')!.queue.push({ id: count + '', type: 'msg' }).then(() => {
          currTstmp = Date.now();
          currDelta = currTstmp - prevTstmp;
          if (count > 0) {
            assert(currDelta > prevDelta, 'Incoherent deltas');
          }
          prevTstmp = currTstmp;
          prevDelta = currDelta;
          count += 1;
          if (count === 10) {
            testDone();
          } else {
            loop();
          }
        }).catch(testDone);
      };
      loop();
    });

  });

  describe('topologies', () => {

    it('circular topology, two nodes, blocking chain', (testDone) => {

      const ir = new InstantRelay();

      ir.addNode('a', (send, broadcast) => {
        let recvd = 0;
        return async (message) => {
          recvd += 1;
          if (recvd === 20) {
            testDone();
            return;
          }
          await send('b', message);
        };
      }, {});

      ir.addNode('b', (send, broadcast) => {
        return async (message) => { await send('a', message); };
      }, {});

      setImmediate(() => {
        ir.nodeMap.get('a')!.queue.push({ id: '0', type: 'greeting' });
      });

    });

    it('circular topology, three nodes, blocking chain', (testDone) => {

      const ir = new InstantRelay();

      ir.addNode('a', (send, broadcast) => {
        let recvd = 0;
        return async (message) => {
          recvd += 1;
          if (recvd === 20) {
            testDone();
            return;
          }
          await send('b', message);
        };
      }, {});

      ir.addNode('b', (send, broadcast) => {
        return async (message) => { await send('c', message); };
      }, {});

      ir.addNode('c', (send, broadcast) => {
        return async (message) => { await send('a', message); };
      }, {});

      setImmediate(() => {
        ir.nodeMap.get('a')!.queue.push({ id: '0', type: 'greeting' });
      });

    });

  });

});
