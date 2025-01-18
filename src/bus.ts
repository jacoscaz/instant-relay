
import { Subscriber } from './subscriber.js';

import fastq from 'fastq';
import { crashIfError, EMPTY_OBJ, noop } from './utils.js';

async function destroyedPublish<M>(this: Bus<M>) {
  throw new Error('Cannot publish a message to a destroyed bus');
}

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
    this.#queue = fastq.promise<Bus<M>, M>(this, Bus.#processQueueItem, opts.concurrency ?? 1);
    this.#dispatch = noop;
    this.#subscribers = [];
    this.#queue.error(crashIfError);
  }

  async publish(message: M) {
    return this.#queue.push(message);
  }

  public addSubscriber(subscriber: Subscriber<M>) {
    if (this.#subscribers.includes(subscriber)) {
      throw new Error('cannot add a subscriber to the same bus more than once');
    }
    this.#subscribers.push(subscriber);
    subscriber.on('destroy', this.#onSubscriberDestroy)
    this.#setDispatch();
  }

  public removeSubscriber(subscriber: Subscriber<M>) {
    const pos = this.#subscribers.indexOf(subscriber);
    if (pos > -1) {
      subscriber.removeListener('destroy', this.#onSubscriberDestroy);
      this.#subscribers.splice(pos, 1);
      this.#setDispatch();
    }
  }

  public destroy() {
    this.#subscribers.forEach((subscriber) => {
      this.removeSubscriber(subscriber);
    });
    this.#queue.killAndDrain();
    this.publish = destroyedPublish;
  }

  #onSubscriberDestroy = (subscriber: Subscriber<M>) => {
    this.removeSubscriber(subscriber);
  }

  #setDispatch() {
    switch (this.#subscribers.length) {
      case 0: 
        this.#dispatch = noop;
        break;
      case 1: 
        this.#dispatch = Bus.#dispatchToFirst; 
        break;
      default: 
        this.#dispatch = Bus.#dispatchToAll;
    }
  }

  static async #dispatchToFirst<M>(this: Bus<M>, message: M) {
    return this.#subscribers[0].dispatch(message);
  }

  static async #dispatchToAll<M>(this: Bus<M>, message: M) {
    return Promise.all(this.#subscribers.map((subscriber) => {
      return subscriber.dispatch(message);
    }));
  }

  static async #processQueueItem<M>(this: Bus<M>, message: M) {
    return this.#dispatch(message);
  }

}
