
import type { Subscriber } from './subscriber.js';

import fastq from 'fastq';

export class Bus<M> {
 
  #queue: fastq.queueAsPromised<M>;
  #recipients: Subscriber<M>[];

  constructor() {
    this.#queue = fastq.promise<Bus<M>, M>(this, Bus.processQueueItem, 1);
    this.#recipients = [];
  }

  async dispatch(message: M) {
    await this.#queue.push(message);
  }

  registerRecipientNode(node: Subscriber<M>) {
    this.#recipients.push(node);
  }

  private static async processQueueItem<M>(this: Bus<M>, message: M) {
    return Promise.all(this.#recipients.map(recipient => recipient.dispatch(message)));
  }

}
