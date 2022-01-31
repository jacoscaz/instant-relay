import fastq from 'fastq';

export interface Callback {
  (err?: Error | null | undefined): any;
}

export interface HandleMessage<M extends Message> {
  (message: M, done: Callback): void;
}

export interface SendMessage<M extends Message> {
  (recipient: string, message: M, done: Callback): void;
}

export interface BroadcastMessage<M extends Message> {
  (message: M, done: Callback): void;
}

export interface NodeFactory<M extends Message, O extends Record<string, any>> {
  (send: SendMessage<M>, broadcast: BroadcastMessage<M>, opts: O & { id: string }): HandleMessage<M>;
}

export interface Message {
  id: string;
  type: string;
}

export interface AddNodeOpts {
  throttle?: (len: number) => number;
  concurrency?: number;
  highWaterMark?: number;
}

export interface InternalNode<M extends Message> {
  readonly id: string;
  readonly incomingQueue: fastq.queue<M>;
}

