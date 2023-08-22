
export interface HandleMessage<M> {
  (message: M): Promise<void>;
}

export interface SendMessage<M> {
  (recipient: string, message: M): Promise<void>;
}

export interface BroadcastMessage<M> {
  (message: M): Promise<void>;
}

export interface NodeFactory<M, O extends {}> {
  (send: SendMessage<M>, broadcast: BroadcastMessage<M>, opts: O & { id: string }): HandleMessage<M>;
}

export interface AddNodeOpts {
  throttle?: (len: number) => number;
  concurrency?: number;
  highWaterMark?: number;
}

export interface InternalNode<M> {
  readonly id: string;
  readonly push: (msg: M) => Promise<void>;
}
