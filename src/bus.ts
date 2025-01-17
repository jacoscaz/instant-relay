
import { Subscriber } from './subscriber.js';

import fastq from 'fastq';
import { crashIfError, EMPTY_OBJ, noop } from './utils.js';

export namespace Bus {

  export interface Opts {
    concurrency?: number;
  }

}

export class Bus<M> {
 
  #queue: fastq.queueAsPromised<M>;
  #dispatch: (this: Bus<M>, message: M) => Promise<any> | any;
  #subscribers: Subscriber<M>[];

  constructor(opts = EMPTY_OBJ) {
    this.#queue = fastq.promise<Bus<M>, M>(this, Bus.processQueueItem, opts.concurrency ?? 1);
    this.#dispatch = Bus.dispatchToNone;
    this.#subscribers = [];
    this.#queue.error(crashIfError);
  }

  async publish(message: M) {
    return this.#queue.push(message);
  }

  addSubscriber(subscriber: Subscriber<M>) {
    if (this.#subscribers.includes(subscriber)) {
      throw new Error('cannot add a subscriber to the same bus more than once');
    }
    this.#subscribers.push(subscriber);
    this.setDispatch();
  }

  removeSubscriber(subscriber: Subscriber<M>) {
    const pos = this.#subscribers.indexOf(subscriber);
    if (pos > -1) {
      this.#subscribers.splice(pos, 1);
    }
    this.setDispatch();
  }

  private setDispatch() {
    switch (this.#subscribers.length) {
      case 0: this.#dispatch = noop; break;
      case 1: this.#dispatch = Bus.dispatchToFirst; break;
      default: this.#dispatch = Bus.dispatchToAll;
    }
  }

  private static async dispatchToNone<M>(this: Bus<M>, message: M) {
    // noop
  }

  private static async dispatchToFirst<M>(this: Bus<M>, message: M) {
    return this.#subscribers[0].dispatch(message);
  }

  private static async dispatchToAll<M>(this: Bus<M>, message: M) {
    return Promise.all(this.#subscribers.map(recipient => recipient.dispatch(message)));
  }

  private static async processQueueItem<M>(this: Bus<M>, message: M) {
    return this.#dispatch(message);
  }

}
