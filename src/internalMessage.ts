import {nanoid} from 'nanoid';
import pino, {Logger} from 'pino';

export class InternalMessage {

  readonly id: string;
  readonly senderId: string;
  readonly logger!: Logger;
  private payload?: unknown;

  constructor(senderId: string) {
    this.id = nanoid();
    this.senderId = senderId;
    Object.defineProperty(this, 'logger', {
      value: pino({name: `${this.senderId}::${this.id}`}),
    });
  }

  setPayload(payload: unknown): void{
    this.payload = payload;
  }

  getPayload(): unknown{
    return this.payload;
  }

}

export default InternalMessage;
