
import assert, { strictEqual, deepStrictEqual } from 'assert';
import { InstantRelay, Message, NodeFactory } from '..';

const noop = () => {};

describe('instant-relay', () => {

  describe('send()', () => {

    it('should send a message to another node', (testDone) => {
      const ir = new InstantRelay();
      ir.addNode('a', (send, broadcast) => {
        setImmediate(() => {
          send('b', { id: '1', type: 'msg'}, noop);
        });
        return () => {};
      }, {});
      ir.addNode('b', (send, broadcast) => {
        return (message, done) => {
          deepStrictEqual(message, { id: '1', type: 'msg' }, 'unexpected message');
          done();
          testDone();
        };
      }, {});
    });

    it('should be throttled if the receiver is slower than the sender', (testDone) => {
      const ir = new InstantRelay();
      ir.addNode('r', (send, broadcast) => {
        return (message, done) => {};
      }, { concurrency: 1, highWaterMark: 16, throttle: len => len * 2 });
      ir.addNode('s', (send, broadcast) => {
        let sent = 0;
        let prevDelta = 0, delta = 0, before = 0, after = 0;
        const loop = () => {
          before = Date.now();
          send('r', { id: sent + '', type: 'hello' }, () => {
            after = Date.now();
            delta = after - before;
            if (sent >= 16) {
              assert(delta >= prevDelta);
              prevDelta = delta;
            }
            if (sent >= 32) {
              testDone();
              return;
            }
            sent += 1;
            setImmediate(loop);
          });
        };
        setImmediate(loop);
        return (message, done) => {};
      }, {});
    });

  });

  describe('broadcast()', () => {

    it('should broadcast a message from one node to another', (testDone) => {
      const ir = new InstantRelay();
      ir.addNode('a', (send, broadcast) => {
        setImmediate(() => {
          broadcast({ id: '1', type: 'msg'}, noop);
        });
        return () => {};
      }, {});
      ir.addNode('b', (send, broadcast) => {
        return (message, done) => {
          deepStrictEqual(message, { id: '1', type: 'msg' }, 'unexpected message');
          done();
          testDone();
        };
      }, {});
    });

    it('should broadcast a message to all other nodes', (testDone) => {
      const ir = new InstantRelay();
      let receivedCount = 0;
      const receiverQty = 3;
      const message: Message = { id: '1', type: 'msg'};
      const receiverFactory: NodeFactory<any, {}> = () => {
        return (receivedMessage, done) => {
          strictEqual(message, receivedMessage);
          receivedCount += 1;
          done();
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
          broadcast(message, noop);
        });
        return () => {};
      }, {});
    });

  });

  describe('topologies', () => {

    it('circular topology, two nodes, blocking chain', (testDone) => {

      const ir = new InstantRelay();

      ir.addNode('a', (send, broadcast) => {
        let recvd = 0;
        return (message, done) => {
          recvd += 1;
          if (recvd === 20) {
            done();
            testDone();
            return;
          }
          send('b', message, done);
        };
      }, {});

      ir.addNode('b', (send, broadcast) => {
        return (message, done) => { send('a', message, done); };
      }, {});

      setImmediate(() => {
        // @ts-ignore
        ir.nodes.get('a')!.push({ id: '0', type: 'greeting' }, () => {});
      });

    });

    it('circular topology, three nodes, blocking chain', (testDone) => {

      const ir = new InstantRelay();

      ir.addNode('a', (send, broadcast) => {
        let recvd = 0;
        return (message, done) => {
          recvd += 1;
          if (recvd === 20) {
            done();
            testDone();
            return;
          }
          send('b', message, done);
        };
      }, {});

      ir.addNode('b', (send, broadcast) => {
        return (message, done) => { send('c', message, done); };
      }, {});

      ir.addNode('c', (send, broadcast) => {
        return (message, done) => { send('a', message, done); };
      }, {});

      setImmediate(() => {
        // @ts-ignore
        ir.nodes.get('a')!.push({ id: '0', type: 'greeting' }, () => {});
      });

    });

  });

});
