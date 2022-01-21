
# instant-relay

`instant-relay` is an opinionated library for asynchronous communication
between nodes in non-hierarchical sets. Each registered node can send 
(one-to-one) or broadcast (one-to-many). It is written in TypeScript for
Node.js, with the following priorities in mind:

1. **Backpressure management and prevention of accidental blocking 
   behavior**, addressed by decoupling message delivery from message
   handling and managing backpressure upon delivery.
2. **Simplicity and ease of debugging**, addressed by a small codebase (~ 300
   LoCs in total), few dependencies (2 direct, 4 in total) and forcing the use
   of unique message identifiers to easily track messages as they are passed
   from node to node.
3. **Performance**, addressed by selecting fast data structure implementations
   and reducing the overall number of allocations per handled message.

`instant-relay` is a work-in-progress and is currently being tested and refined
in pre-production environments. It was born out of the convergence of previous
projects in the space of multi-protocol gateways for the IoT sector

## How to use

A new relay is created through the `InstantRelay` class, which requires a
union of possible message types as a type argument. 

Message types _must_ implement the `Message` interface, which mandates the
presence of the `id` and `type` properties.

New nodes can be added to an instance of the `InstantRelay` class by providing
dedicated factory functions implementing the `NodeFactory` interface.

```typescript
import { InstantRelay, Message, NodeFactory, uid } from 'instant-relay';

interface Request extends Message { type: 'req'; }
interface Response extends Message { type: 'res'; reqId: string; }
type Messages = Request | Response;

const relay = new InstantRelay<Messages>();

const serverFactory: NodeFactory<Messages, {}> = (send, broadcast, opts) => {

  return (message, done) => {
    switch (message.type) {
      case 'req':
        console.log(`server received request ${message.id}`);
        setTimeout(() => {
          send('client', { id: uid(), type: 'res', reqId: message.id }, done);
        }, Math.random() * 200);
        break;
      default:
        done();
    }
  };
};

relay.addNode('server', serverFactory, {});

const clientFactory: NodeFactory<Messages, {}> = (send, broadcast, opts) => {

  const loop = () => {
    send('server', { id: uid(), type: 'req' }, loop);
  };

  setImmediate(loop);

  return (message, done) => {
    switch (message.type) {
      case 'res':
        console.log(`client received a response for request ${message.reqId}`);
        done();
        break;
      default:
        done();
    }

  };
};

relay.addNode('client', clientFactory, {});
```

Due to backpressure support, the loop that sends requests to the server node
will quickly slow down to a rate compatible with the artificial latency.

## Debug

`instant-relay` uses the `debug` module with the `instant-relay` namespace.
Debug messages can be enabled by setting the `DEBUG` environment variable as
follows: 

```shell
DEBUG="instant-relay*" node index.js
```

## License

Licensed under [MIT](./LICENSE).
