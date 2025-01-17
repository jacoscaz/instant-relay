
import type { Bus } from './bus.js';

import fastq from 'fastq';
import { wait, asyncNoop, EMPTY_OBJ } from './utils.js';

type WaitFn = (len: number, throttle: Subscriber.ThrottleFn) => Promise<any>;

const wait_fns_by_boolean = new Map<boolean, WaitFn>([
  [true, (len, throttle) => wait(throttle(len))], 
  [false, asyncNoop],
]);

export namespace Subscriber {

  export type MessageHandler<M> = (message: M) => Promise<any>;

  export type ThrottleFn = (len: number) => number;

  export interface Opts {
    throttle?: ThrottleFn;
    high_watermark?: number;
  }

}

export class Subscriber<M> {

  #queue: fastq.queueAsPromised<M>;
  #throttle: Subscriber.ThrottleFn;
  #message_handler: Subscriber.MessageHandler<M>;
  #high_watermark: number;

  private constructor(message_handler: Subscriber.MessageHandler<M>, opts: Subscriber.Opts = EMPTY_OBJ) {
    this.#queue = fastq.promise<Subscriber<M>, M>(this, Subscriber.processQueueItem, 1);
    this.#throttle = opts.throttle ?? ((len: number) => len);
    this.#message_handler = message_handler;
    this.#high_watermark = opts.high_watermark ?? 16;
  }

  private static async processQueueItem<M>(this: Subscriber<M>, message: M) {
    await this.#message_handler(message);
  }

  public async dispatch(message: M) {
    this.#queue.push(message);
    const len = this.#queue.length();
    await wait_fns_by_boolean.get(Math.min(len, this.#high_watermark) === this.#high_watermark)!(len, this.#throttle);
  }

  public static create<T>(buses: Bus<T>[], handler: Subscriber.MessageHandler<T>, opts: Subscriber.Opts = EMPTY_OBJ) {
    const subscriber = new Subscriber(handler, opts);  
    buses.forEach((bus) => {
      bus.registerRecipientNode(subscriber);
    });
  };

}
