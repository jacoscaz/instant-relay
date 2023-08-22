
# instant-relay

`instant-relay` is an opinionated library for asynchronous communication
between nodes in non-hierarchical sets. Each registered node can send 
(one-to-one) or broadcast (one-to-many). It is written in TypeScript for
Node.js, with the following priorities in mind:

1. **Backpressure management and prevention of accidental blocking 
   behavior**, addressed by decoupling message delivery from message
   handling and managing backpressure upon delivery.
2. **Simplicity and ease of debugging**, addressed by a small codebase (~ 300
   LoCs in total) and few dependencies (1 direct, 2 in total).
3. **Performance**, addressed by selecting fast data structure implementations
   and reducing the overall number of allocations per handled message.

`instant-relay` was born out of the convergence of previous projects in the
space of multi-protocol gateways for the IoT sector.

## How to use

A new relay is created through the `InstantRelay` class, which requires a
union of possible message types as a type argument.

New nodes can be added to an instance of the `InstantRelay` class by providing
dedicated factory functions implementing the `NodeFactory` interface.

```typescript
import { uid } from 'uid';
import { InstantRelay, NodeFactory } from 'instant-relay';

// Message types
interface Request { id: string; type: 'req'; }
interface Response { type: 'res'; reqId: string; }

// Union of all possible message types
type Message = Request | Response;

// Promisified setTimeout()
const wait = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

// Main instance
const relay = new InstantRelay<Message>();

// Factory function for "server" nodes
const serverFactory: NodeFactory<Message, {}> = (send, broadcast, opts) => {
  return async (message) => {
    switch (message.type) {
      case 'req':
        console.log(`server received request ${message.id}`);
        await wait(Math.random() * 1000);
        await send('client', { type: 'res', reqId: message.id });
        break;
      default:
    }
  };
};

// Add one "server" node with custom options
relay.addNode('server', serverFactory, {
  concurrency: 2,                             // How many messages may be processed in parallel
  highWaterMark: 2,                           // Threshold above which throttling starts
  throttle: queueLength => queueLength * 10,  // Set throttling delay based on queue length
});

// Factory function for "client" nodes
const clientFactory: NodeFactory<Message, {}> = (send, broadcast, opts) => {
  // Send loop w/ backpressure support
  const loop = () => {
    const now = Date.now();
    send('server', { id: uid(), type: 'req' }).then(() => {
      console.log('client loop lag', Date.now() - now);
      setImmediate(loop);
    });
  };
  setImmediate(loop);
  return async (message) => {
    switch (message.type) {
      case 'res':
        console.log(`client received a response for request ${message.reqId}`);
        break;
      default:
    }
  };
};

relay.addNode('client', clientFactory, {});
```

Due to backpressure support, the loop that sends requests to the server node
will quickly slow down to a rate compatible with the artificial latency.

## License

Licensed under [MIT](./LICENSE).
