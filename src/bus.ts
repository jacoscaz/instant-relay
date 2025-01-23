
import type { Subscriber } from './subscriber.js';

import fastq from 'fastq';
import { crashIfError, EMPTY_OBJ, noopAsync } from './utils.js';


export namespace Bus {

  export interface Opts {
    concurrency?: number;
  }

}

export abstract class Bus<I, SR, BR> {
  
  protected _subscribers: Subscriber<I, SR>[];
  protected _queue: fastq.queueAsPromised<I, BR>;
  protected abstract _worker: fastq.asyncWorker<any, I, BR>

  constructor(opts: Bus.Opts = EMPTY_OBJ) {
    this._queue = fastq.promise<any, I, BR>(this, (task) => this._worker(task), opts.concurrency ?? 1);
    this._queue.error(crashIfError);
    this._subscribers = [];
  }

  addSubscriber(subscriber: Subscriber<I, SR>) {
    if (!this._subscribers.includes(subscriber)) {
      this._subscribers.push(subscriber);
      subscriber.on('destroy', this._onSubscriberDestroy);  
    }
    this._queue.resume();
  }

  removeSubscriber(subscriber: Subscriber<I, SR>) {
    const pos = this._subscribers.indexOf(subscriber);
    if (pos > -1) {
      subscriber.removeListener('destroy', this._onSubscriberDestroy);
      this._subscribers.splice(pos, 1);
    }
    if (this._subscribers.length === 0) {
      this._queue.pause();
    }
  }

  lag(): number {
    return this._queue.length();
  }

  destroy() {
    this._queue.killAndDrain();
    this._subscribers.forEach((subscriber) => {
      this.removeSubscriber(subscriber);
    });
    this.publish = this._destroyedPublish;
  }

  async publish(message: I): Promise<BR> {
    return this._queue.push(message);
  }

  protected _onSubscriberDestroy = (subscriber: Subscriber<I, SR>) => {
    this.removeSubscriber(subscriber);
  }

  protected async _destroyedPublish(): Promise<BR> {
    throw new Error('Cannot publish a message to a destroyed bus');
  }

}



export namespace BusToOne {
  export type Selector<I, SR> = { pick(subscribers: [Subscriber<I, SR>, ...rest: Subscriber<I, SR>[]]): Subscriber<I, SR>; };
  export type Opts<I, SR> = Bus.Opts & { selector?: Selector<I, SR> };
}

export class BusToOne<I = any, SR = any | undefined> extends Bus<I, SR, SR> {

  protected _selector: BusToOne.Selector<I, SR>;

  constructor(opts: BusToOne.Opts<I, SR> = EMPTY_OBJ) {
    super(opts);
    this._selector = opts.selector ?? new BusToOne.RoundRobinSelector();
  }

  _worker = async (message: I): Promise<SR> => {
    return this._selector.pick(this._subscribers as [Subscriber<I, SR>, ...rest: Subscriber<I, SR>[]]).dispatch(message);
  }

  static FirstSelector = class FirstSelector<I, SR> implements BusToOne.Selector<I, SR> {
    pick(subscribers: [Subscriber<I, SR>, ...rest: Subscriber<I, SR>[]]): Subscriber<I, SR> {
      return subscribers[0];
    }
  }

  static RoundRobinSelector = class RoundRobinSelector<I, SR> implements BusToOne.Selector<I, SR> {
    #curr: number = 0;
    pick(subscribers: [Subscriber<I, SR>, ...rest: Subscriber<I, SR>[]]): Subscriber<I, SR> {
      return subscribers[this.#curr = (this.#curr + 1) % subscribers.length];
    }
  }

  static LowestLagSelector = class LowestLagSelector<I, SR> implements BusToOne.Selector<I, SR> {
    pick(subscribers: [Subscriber<I, SR>, ...rest: Subscriber<I, SR>[]]): Subscriber<I, SR> {
      return subscribers.reduce((sel, sub) => {
        return sel.lag() < sub.lag() ? sel : sub;
      });
    }
  }

}

export namespace BusToMany {
  export type Selector<I, SR> = { pick(subscribers: Subscriber<I, SR>[]): Subscriber<I, SR>[]; };
  export type Opts<I, SR> = Bus.Opts & { selector?: Selector<I, SR> };
}

export class BusToMany<I = any, SR = any> extends Bus<I, SR, SR[]> {

  protected _selector: BusToMany.Selector<I, SR>;

  constructor(opts: BusToMany.Opts<I, SR> = EMPTY_OBJ) {
    super(opts);
    this._selector = opts.selector ?? new BusToMany.AllSelector();
  }

  _worker = async (message: I): Promise<SR[]> => {
    return Promise.all(
      this._selector.pick(this._subscribers as [Subscriber<I, SR>, ...rest: Subscriber<I, SR>[]])
        .map(subscriber => subscriber.dispatch(message))
    );
  }

  static AllSelector = class AllSelector<I, SR> implements BusToMany.Selector<I, SR> {
    pick(subscribers: Subscriber<I, SR>[]): Subscriber<I, SR>[] {
      return subscribers;
    }
  }

}
