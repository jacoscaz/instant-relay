
import type {
  BroadcastMessage,
  Callback,
  NodeFactory,
  InternalNode,
  Message,
  AddNodeOpts,
  SendMessage,
} from './types';

import fastq from 'fastq';
import debug from 'debug';
import { forEach, crashWithError } from './utils';

const dbg = debug('instant-relay');

const makeSend = <M extends Message>(nodes: Map<string, InternalNode<M>>, senderId: string): SendMessage<M> => {
  return (recipientId: string, message: M, done: Callback) => {
    if (recipientId === senderId) {
      crashWithError(new Error(`Node "${senderId}" tried to send a message to itself`));
    }
    if (!nodes.has(recipientId)) {
      crashWithError(new Error(`Unknown node with id "${recipientId}"`));
    }
    const recipient = nodes.get(recipientId)!;
    dbg('SEND | from', senderId, 'to', recipient.id, 'msg', message.id, 'type', message.type);
    recipient.incomingQueue.push(message, done);
  };
};

const makeBroadcast = <M extends Message>(nodes: Map<string, InternalNode<M>>, senderId: string): BroadcastMessage<M> => {
  const onEach = (recipient: InternalNode<M>, next: Callback, message: M) => {
    if (recipient.id !== senderId) {
      dbg('BCST | from', senderId, 'to', recipient.id, 'msg', message.id, 'type', message.type);
      recipient.incomingQueue.push(message, next);
      return;
    }
    next();
  };
  return (message: M, done: Callback) => {
    forEach(nodes, onEach, done, message);
  };
};

export const makeNode = <M extends Message, O>(
  nodes: Map<string, InternalNode<M>>,
  id: string,
  factory: NodeFactory<M, O>,
  opts: AddNodeOpts & O,
): InternalNode<M> => {

  const throttle = opts.throttle || (len => len);
  const concurrency = opts.concurrency || 1;
  const highWaterMark = opts.highWaterMark || 16;

  const send = makeSend(nodes, id);
  const broadcast = makeBroadcast(nodes, id);
  const handleMessage = factory(send, broadcast, { ...opts, id });

  let handlingQueueLength = 0;

  const handlingQueue = fastq((msg: M, done: fastq.done) => {
    handleMessage(msg, (err) => {
      dbg('PROC | node', id, 'msg', msg.id, 'type', msg.type);
      handlingQueueLength -= 1;
      if (err) {
        crashWithError(err);
      }
      done(null);
    });
  }, concurrency);

  const onIncomingThrottlingTimeout = (msg: M, done: fastq.done) => {
    handlingQueue.push(msg);
    handlingQueueLength += 1;
    done(null);
  };

  const incomingQueue = fastq((msg: M, done: fastq.done) => {
    if (handlingQueueLength < highWaterMark) {
      handlingQueue.push(msg);
      handlingQueueLength += 1;
      Promise.resolve(null).then(done);
    } else {
      setTimeout(onIncomingThrottlingTimeout, throttle(handlingQueueLength), msg, done);
    }
  }, 1);

  return { id, incomingQueue };

};
