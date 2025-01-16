
import type {
  BroadcastMessage,
  NodeFactory,
  InternalNode,
  AddNodeOpts,
  SendMessage,
} from './types.js';

import fastq from 'fastq';
import { crashWithError, wait } from './utils.js';

const makeSend = <M>(nodeMap: Map<string, InternalNode<M>>, senderId: string): SendMessage<M> => {
  return async (recipientId: string, message: M) => {
    if (recipientId === senderId) {
      crashWithError(new Error(`Node "${senderId}" tried to send a message to itself`));
    }
    const recipient = nodeMap.get(recipientId);
    if (!recipient) {
      crashWithError(new Error(`Unknown node with id "${recipientId}"`));
      return;
    }
    await recipient.queue.push(message);
  };
};

const makeBroadcast = <M>(nodeArr: InternalNode<M>[], senderId: string): BroadcastMessage<M> => {
  return async (msg: M) => {
    await Promise.all(nodeArr.map(node => node.id !== senderId ? node.queue.push(msg) : null));
  };
};

export const makeNode = <M, O extends {}>(
  nodeMap: Map<string, InternalNode<M>>,
  nodeArr: InternalNode<M>[],
  id: string,
  factory: NodeFactory<M, O>,
  opts: AddNodeOpts & O,
) => {

  if (nodeMap.has(id)) {
    crashWithError(new Error(`id "${id}" already in use`));
    return;
  }
  
  const throttle = opts.throttle || ((len: number) => len);
  const concurrency = opts.concurrency || 1;
  const highWaterMark = opts.highWaterMark || 16;

  const send = makeSend(nodeMap, id);
  const broadcast = makeBroadcast(nodeArr, id);
  const handleMessage = factory(send, broadcast, { ...opts, id });

  const handlingQueue = fastq.promise(handleMessage, concurrency);

  handlingQueue.error((err, task) => {
    if (err !== null) {
      crashWithError(err);
      return;
    }
  });

  let handlingQueueLength = 0;

  const incomingQueue = fastq.promise(async (msg: M) => {
    handlingQueue.push(msg);
    if ((handlingQueueLength = handlingQueue.length()) >= highWaterMark) {
      await wait(throttle(handlingQueueLength));
    }
  }, 1);

  const node: InternalNode<M> = { id, queue: incomingQueue };

  nodeMap.set(id, node);
  nodeArr.push(node);

};
