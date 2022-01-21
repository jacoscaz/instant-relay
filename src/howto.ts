
import { InstantRelay, Message, NodeFactory, uid } from './';

interface Request extends Message { type: 'req'; }
interface Response extends Message { type: 'res'; reqId: string; }
type Messages = Request | Response;

const relay = new InstantRelay<Messages>();

const serverFactory: NodeFactory<Messages, {}> = (send, broadcast, opts) => {

  return (message, done) => {
    switch (message.type) {
      case 'req':
        console.log(`server received request ${message.id}`);
        setTimeout(() => {
          send('client', { id: uid(), type: 'res', reqId: message.id }, done);
        }, Math.random() * 200);
        break;
      default:
        done();
    }
  };
};

relay.addNode('server', serverFactory, {});

const clientFactory: NodeFactory<Messages, {}> = (send, broadcast, opts) => {

  const loop = () => {
    send('server', { id: uid(), type: 'req' }, loop);
  };

  setImmediate(loop);

  return (message, done) => {
    switch (message.type) {
      case 'res':
        console.log(`client received a response for request ${message.reqId}`);
        done();
        break;
      default:
        done();
    }

  };
};

relay.addNode('client', clientFactory, {});
