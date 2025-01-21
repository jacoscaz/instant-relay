
import type { Bus } from './bus.js';

import { EventEmitter } from 'node:events';
import fastq from 'fastq';
import { EMPTY_OBJ, crashIfError, noop } from './utils.js';

export namespace Subscriber {

  export type MessageHandler<M> = (this: Subscriber<M>, message: M) => Promise<any>;

  export type ThrottleFn = (len: number) => number;

  export type DestroyListener = () => any;

  export interface Opts {
    throttle?: ThrottleFn;
    concurrency?: number;
    high_watermark?: number;
  }

  export interface Events<M> {
    'destroy': [Subscriber<M>],
  }

}

export class Subscriber<M> extends EventEmitter<Subscriber.Events<M>> {

  #queue: fastq.queueAsPromised<M>;
  #deferred: () => any;
  #high_watermark: number;

  private constructor(message_handler: Subscriber.MessageHandler<M>, opts: Subscriber.Opts = EMPTY_OBJ) {
    super();
    this.#queue = fastq.promise<Subscriber<M>, M>(this, message_handler, opts.concurrency ?? 1);
    this.#high_watermark = opts.high_watermark ?? 16;
    this.#queue.error(crashIfError);
    this.#queue.empty = this.#onEmptyQueue;
    this.#deferred = noop;
  }

  #onEmptyQueue = () => {
    this.#deferred();
    this.#deferred = noop;
  };

  async dispatch(message: M) {
    this.#queue.push(message);
    if (this.#queue.length() < this.#high_watermark) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.#deferred = resolve;
    });
  }

  public destroy() {
    this.#queue.killAndDrain();
    this.emit('destroy', this);
  }

  public static create<T>(buses: Bus<T> | Bus<T>[], handler: Subscriber.MessageHandler<T>, opts: Subscriber.Opts = EMPTY_OBJ) {
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
