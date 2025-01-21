
import type { Subscriber } from './subscriber.js';

import fastq from 'fastq';
import { crashIfError, EMPTY_OBJ, noopAsync } from './utils.js';


export namespace Bus {

  export type Transform<I, O> = (message: I) => O | Promise<O>;

  export interface Opts<I, O> {
    transform?: Transform<I, O>;
    concurrency?: number;
  }

}


export class Bus<I, O = I> {
 
  #queue: fastq.queueAsPromised<I>;
  #dispatch: (this: Bus<I, O>, message: O) => Promise<any>;
  #subscribers: Subscriber<O>[];

  constructor(opts: Bus.Opts<I, O> = EMPTY_OBJ) {
    this.#queue = fastq.promise<Bus<I, O>, I>(this, opts.transform ? this.#makeTransformWorker(opts.transform) : this.#workerThrough, opts.concurrency ?? 1);
    this.#dispatch = noopAsync;
    this.#subscribers = [];
    this.#queue.error(crashIfError);
  }

  async publish(message: I) {
    return this.#queue.push(message);
  }

  public addSubscriber(subscriber: Subscriber<O>) {
    if (this.#subscribers.includes(subscriber)) {
      throw new Error('cannot add a subscriber to the same bus more than once');
    }
    this.#subscribers.push(subscriber);
    subscriber.on('destroy', this.#onSubscriberDestroy)
    this.#setDispatch();
  }

  public removeSubscriber(subscriber: Subscriber<O>) {
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
    this.publish = this.#destroyedPublish;
  }

  #onSubscriberDestroy = (subscriber: Subscriber<O>) => {
    this.removeSubscriber(subscriber);
  }

  #setDispatch() {
    switch (this.#subscribers.length) {
      case 0: 
        this.#dispatch = noopAsync;
        break;
      case 1: 
        this.#dispatch = this.#dispatchToFirst; 
        break;
      default: 
        this.#dispatch = this.#dispatchToAll;
    }
  }

  async #dispatchToFirst(message: O) {
    return this.#subscribers[0].dispatch(message);
  }

  async #dispatchToAll(message: O) {
    return Promise.all(this.#subscribers.map((subscriber) => {
      return subscriber.dispatch(message);
    }));
  }

  #workerThrough: fastq.asyncWorker<Bus<I, O>, I> = (message: I) => {
    return this.#dispatch(message as unknown as O);
  }
  
  #makeTransformWorker(transform: Bus.Transform<I, O>): fastq.asyncWorker<Bus<I, O>, I> {
    return async (message) => {
      return this.#dispatch(await transform(message));
    }
  }

  async #destroyedPublish() {
    throw new Error('Cannot publish a message to a destroyed bus');
  }

}
