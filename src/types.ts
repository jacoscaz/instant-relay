import fastq from 'fastq';
import {InternalMessage} from './internalMessage';

export type Receive = (msg: InternalMessage, callback: Callback) => void;
export type Callback = (err?: Error | null, data?: unknown) => void;
export type Send = (msg: InternalMessage, callback: Callback) => void;

export interface Queue {
  recipientId: string,
  queue: fastq.queue<InternalMessage, unknown>,
}

export interface IRNode {
  id: string,
  elaborate: Receive,
}

export interface RoutingConf {
  senderId: string,
  allowedRecipientIds: string[],
}
