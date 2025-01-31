
# instant-relay

`instant-relay` is a library of primitives for backpressure-aware,
intra-process asynchronous communication. It provides foundational
building blocks that may be combined to form any desired topology.

## How to use

`instant-relay` exports three primitive classes: `BusToOne`, `BusToMany` and 
`Subscriber`.

```ts
import { BusToOne, ButToMany, Subscriber } from 'instant-relay';
```

### The `Bus` abstract class

A bus is a strongly-typed communication channel which multiple consumers
may subscribe to and which multiple producers may publish to. Each bus is
typed according to the kinds of messages that may be published to it and
to the kind of values that may be returned by subscribers as a result of
processing each message. 

All bus classes extends the abstract `Bus` class. `Bus` instances are
backpressure-aware; the `Bus.prototype.publish()` method returns a promise
that resolves when it is safe to publish additional messages.

Buses may be terminated via the `Bus.prototype.destroy()` method.

### The `BusToOne` class

The `BusToOne` class implements a bus that dispatches published messages to
only one of its subscribers, selected according to the specified strategy.

The promise returned by the `BusToOne.prototype.publish()` method resolves
to the value returned by the (one) subscriber that processed the message.

```ts
const number_bus = new BusToOne<number, string>();
const as_string: string = await number_bus.publish(Math.random());
```

Subscriber selector functions can be passed to the `BusToOne` constructor via
the `selector` option:

```typescript
const selector: BusToOne.Selector = { pick: subs => subs[0] };
new BusToOne<number, string>({ selector });
```

Available strategies:

| default | class | description |
| --- | --- | --- |
|| `BusToOne.FirstSelector` | returns the first subscriber in the array |
| X | `BusToOne.RoundRobinSelector` | cycles through subscriber |
|| `BusToOne.RandomSelector` | returns a randomly-selected subscriber |
|| `BusToOne.LowestLagSelector` | returns the subscriber with the lowest lag |

The `concurrency` constructor option can be used to set the max. amount of
concurrent dispatches to subscribers.


### The `BusToMany` class

The `BusToMany` class implements a bus that dispatches published messages to
some or all of its subscribers, selected according to the specified strategy.

The promised returned by the `BusToMany.prototype.publish()` method resolves
to an array of all the values returned by the (multiple) subscribers that
processed the message.

```ts
const number_bus = new BusToOne<number, string>();
const as_string: string[] = await number_bus.publish(Math.random());
```

Subscriber selector functions can be passed to the `BusToMany` constructor via
the `selector` option:

```typescript
const selector: BusToMany.Selector = { pick: subs => subs.slice(1) };
new BusToMany<number, string>({ selector });
```

Available strategies:

| default | class | description |
| --- | --- | --- |
| X | `BusToMany.AllSelector` | returns all subscribers in the array |

The `concurrency` constructor option can be used to set the max. amount of
concurrent dispatches to subscribers.

#### The `Subscriber` class

The `Subscriber` class may be used to create subscribers to one or more `Bus`
instances out of a single handler function. The TS compiler will automatically
infer the type of the message passed to the handler function based on the 
provided `Bus` instances.

```ts
const number_bus = new BusToOne<number>();
const boolean_bus = new BusToOne<boolean>();

const subscriber = Subscriber.create([number_bus, boolean_bus], async (message) => {
  // This will make the TS compiler throw an error
  // as the type of message is `number | boolean`
  // and must be narrowed further before treating
  // it as a number.
  message + 2;
});
```

Subscribers may be terminated via the `Subscriber.prototype.destroy()` method.

The `concurrency` constructor option can be used to set the max. amount of
messages being processed at any one time.

## License

Licensed under [MIT](./LICENSE).
