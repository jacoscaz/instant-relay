import {nanoid} from 'nanoid';
import pino, {Logger} from 'pino';

export class InternalMessage {

  private readonly id: string;
  private readonly senderId: string;
  private readonly logger!: Logger;
  private payload?: unknown;

  constructor(senderId: string) {
    this.id = nanoid();
    this.senderId = senderId;
    Object.defineProperty(this, 'logger', {
      value: pino({name: `${this.senderId}::${this.id}`}),
    });
  }

  getLogger(): Logger {
    return this.logger;
  }

  setPayload(payload: unknown): void{
    this.payload = payload;
  }

  getPayload(): unknown{
    return this.payload;
  }

}

export default InternalMessage;
