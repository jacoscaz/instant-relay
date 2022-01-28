
import assert, { strictEqual } from 'assert';
import { InstantRelay, Message, NodeFactory } from '..';

const noop = () => {};

describe('instant-relay', () => {

  describe('send()', () => {

    it('should send a message to another node', (testDone) => {
      const ir = new InstantRelay();
      const msg = { id: '1', type: 'msg' };
      ir.addNode('a', (send, broadcast) => {
        setImmediate(() => {
          send('b', msg, noop);
        });
        return () => {};
      }, {});
      ir.addNode('b', (send, broadcast) => {
        return (message, done) => {
          strictEqual(message, msg);
          done();
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
          broadcast(msg, noop);
        });
        return () => {};
      }, {});
      ir.addNode('b', (send, broadcast) => {
        return (message, done) => {
          strictEqual(message, msg, 'unexpected message');
          done();
          testDone();
        };
      }, {});
    });

    it('should broadcast a message to all other nodes', (testDone) => {
      const ir = new InstantRelay();
      let receivedCount = 0;
      const receiverQty = 3;
      const msg: Message = { id: '1', type: 'msg'};
      const receiverFactory: NodeFactory<any, {}> = () => {
        return (receivedMessage, done) => {
          strictEqual(msg, receivedMessage);
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
          broadcast(msg, noop);
        });
        return () => {};
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
        return (message, done) => {};
      }, opts);
      for (let i = 0; i < 4; i += 1) {
        // @ts-ignore
        ir.nodes.get('r')!.push({ id: i + '', type: 'msg' }, () => {});
      }
    });

    it('throttling should result in higher latencies for pushers', (testDone) => {
      const ir = new InstantRelay();
      ir.addNode('r', (send, broadcast) => {
        return (message, done) => {};
      }, { highWaterMark: 1, throttle: (len: number) => len * 5 });
      let prevTstmp = Date.now();
      let currTstmp = prevTstmp;
      let prevDelta = 0;
      let currDelta = 0;
      let count = 0;
      const loop = () => {
        count += 1;
        // @ts-ignore
        ir.nodes.get('r')!.push({ id: count + '', type: 'msg' }, () => {
          currTstmp = Date.now();
          currDelta = currTstmp - prevTstmp;
          assert(currDelta > prevDelta);
          prevTstmp = currTstmp;
          prevDelta = currDelta;
          if (count === 10) {
            testDone();
          } else {
            loop();
          }
        });
      };
      // @ts-ignore
      ir.nodes.get('r')!.push({ id: count + '', type: 'msg' }, loop);
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
