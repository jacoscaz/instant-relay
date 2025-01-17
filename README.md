
# instant-relay

`instant-relay` is an opinionated library for intra-process asynchronous
communication. It offers simple primitives that may be used to build many
kinds of graph topologies. It is written in TypeScript with the following
priorities in mind:

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

`instant-relay` exports two primitives as classes: `Bus` and `Subscriber`.

```ts
import { Bus, Subscriber } from 'instant-relay';
```

### The `Bus` class

A `Bus` is a strongly-typed communication channel which multiple consumers
may subscribe to and which multiple producers may publish to. Each bus is
typed according to which messages may be published to it.

```ts
const number_bus = new Bus<number>();
number_bus.publish(Math.random());
```

`Bus` instances are backpressure-aware; the `Bus.prototype.publish()` method 
returns a promise that resolves when it is safe to publish additional messages.

```ts
const number_bus = new Bus<number>();
const publish_loop = () => {
  number_bus.publish(Math.random()).then(() => publish_loop);
};
publish_loop();
```

In the example above, the loop slows down to match the consumption rate of the
subscribers to `number_bus` (dictated by the slowest subscriber).

### The `Subscriber` class

The `Subscriber` class may be used to create subscribers to one or more `Bus`
instances out of a single handler function. The TS compiler will automatically
infer the type of the message passed to the handler function based on the 
provided `Bus` instances.

```ts
const number_bus = new Bus<number>();
const boolean_bus = new Bus<boolean>();

Subscriber.create([number_bus, boolean_bus], async (message) => {
  // This will make the TS compiler throw an error
  // as the type of message is `number | boolean`
  // and must be narrowed further before treating
  // it as a number.
  message + 2;
});
```

## License

Licensed under [MIT](./LICENSE).
