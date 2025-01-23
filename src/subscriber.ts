
import type { Bus } from './bus.js';

import { EventEmitter } from 'node:events';
import fastq from 'fastq';
import { EMPTY_OBJ, crashIfError, noop } from './utils.js';

export namespace Subscriber {

  export type MessageHandler<I, O> = (this: Subscriber<I, O>, message: I) => Promise<O>;

  export type DestroyListener = () => any;

  export interface Opts {
    concurrency?: number;
  }

  export interface Events<I, O> {
    'destroy': [Subscriber<I, O>],
  }

}

export class Subscriber<I, O> extends EventEmitter<Subscriber.Events<I, O>> {

  #queue: fastq.queueAsPromised<I, O>;

  private constructor(message_handler: Subscriber.MessageHandler<I, O>, opts: Subscriber.Opts = EMPTY_OBJ) {
    super();
    this.#queue = fastq.promise<Subscriber<I, O>, I, O>(this, message_handler, opts.concurrency ?? 1);
    this.#queue.error(crashIfError);
  }

  async dispatch(message: I): Promise<O> {
    return this.#queue.push(message);
  }

  destroy() {
    this.#queue.killAndDrain();
    this.emit('destroy', this);
  }

  lag() {
    return this.#queue.length();
  }

  static create<I, O>(buses: Bus<I, O, any> | Bus<I, O, any>[], handler: Subscriber.MessageHandler<I, O>, opts: Subscriber.Opts = EMPTY_OBJ) {
    const subscriber = new Subscriber(handler, opts);  
    if (Array.isArray(buses)) {
      buses.forEach((bus) => {
        bus.addSubscriber(subscriber);
      });
    } else {
      buses.addSubscriber(subscriber);
    }
    return subscriber;
  };

}
