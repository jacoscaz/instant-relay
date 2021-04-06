import fastq from 'fastq';
import async from 'async';
import {
  IRNode,
  Send,
  Queue,
  RoutingConf,
  Callback,
} from './types';
import {InternalMessage} from './internalMessage';

/**
 * This is the lib main class, containing the message routing business logic.
 */
export class InstantRelay {
  private readonly nodes: Record<string, IRNode>;
  private readonly queues: Record<string, Queue[]>;

  constructor() {
    this.nodes = Object.create(null);
    this.queues = Object.create(null);
  }

  /**
   * It adds nodes to the Instant Relay instance
   */
  registerIRNodes(...ws: IRNode[]): void {
    ws.forEach((w) => this.nodes[w.id] = w);
  }

  /**
   * It initializes the queues, one for each allowed recipient, for the node identified by routing senderId
   */
  wireCommunication(routing: RoutingConf): void {
    const {
      senderId,
      allowedRecipientIds,
    } = routing;

    allowedRecipientIds.forEach((rId) => {
      const node = this.nodes[rId];
      if (typeof node === 'undefined') {
        throw new Error(`Cannot initialize queues from ${senderId}. IRNode ${rId} not registered`);
      }
    });

    const oldSenderQueues = this.queues[senderId];
    if (typeof oldSenderQueues !== 'undefined') {
      throw new Error(`Cannot initialize queues from ${senderId}: queues already present`);
    }

    const newSenderQueues = allowedRecipientIds.map((r) => {
      return {
        recipientId: r,
        queue: fastq((msg: InternalMessage, callback) => {
          const node = this.nodes[r];
          if (node && node.elaborate) {
            node.elaborate(msg, <Callback>callback);
          }
        }, 1),
      };
    });

    this.queues[senderId] = newSenderQueues;
  }

  /**
   * It removes all the queues associated to the node identified by senderId
   */
  unwireCommunication(senderId: string): void {
    const senderQueues = this.queues[senderId];
    if (typeof senderQueues !== 'undefined') {
      senderQueues.forEach((q) => q.queue.kill());
    }
    delete this.queues[senderId];
  }

  /**
   * It sends the message to all the recipients specified if any, otherwise it will send the message to all the nodes
   * wired to the sender node.
   * The callback is called when all the receiver nodes have read the message
   */
  private send(msg: InternalMessage, recipients: string[] = [], callback: Callback = () => {}): void {
    const senderQueues = this.queues[msg['senderId']];

    // if no queue for the senderId is found, return
    if (typeof senderQueues === 'undefined') return;

    async.each(senderQueues, (q: Queue, cb: Callback) => {
      if (recipients.length === 0 || recipients.includes(q.recipientId)) {
        q.queue.push(msg, cb);
      } else {
        cb();
      }
    }, callback);
  }

  /**
   * It returns a function that sends a message to the recipients specified
   */
  getSend(recipients: string[] = []): Send {
    return (msg: InternalMessage, callback: Callback = () => {}) => {
      this.send(msg, recipients, callback);
    };
  }

}

export default InstantRelay;
export * from './types';
export * from './internalMessage';
