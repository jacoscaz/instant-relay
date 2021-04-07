
const {InstantRelay} = require('../dist');

const ir = new InstantRelay();


// Here I implement the sender node
class DummySender {

  // The first two parameters of a node must be an id and the `send` function
  constructor(id, send) {
    this.id = id;
    this.send = send;
  }

  start() {
    const sendLoop = () => {
      // Create an empty message associated to this sender
      const msg = InstantRelay.createEmptyMessage(this.id);

      // Populate with a payload
      msg.setPayload(`Message sent at ${new Date().toISOString()}`);

      // Send!
      this.send(msg, () => {
        setTimeout(sendLoop.bind(this), 1000);
      });
    };

    sendLoop();
  }
}

// Here I implement the receiver node
class DummyReceiver {
  constructor(id, send) {
    this.id = id;
    this.send = send;
  }

  // The elaborate function is mandatory for all the nodes that have to receive messages
  elaborate(msg, cb) {
    msg.logger.info(msg, `I reached the destination ${this.id}`);
    cb();
  }
}

// Nodes instantiation
const sender = new DummySender('dummy-sender', ir.getSend());
const receiver = new DummyReceiver('dummy-receiver');


// There the nodes are registered into Instant Relay
ir.registerIRNodes(sender, receiver);

// Wire the node together
ir.wireCommunication({
  senderId: 'dummy-sender', // The sender
  allowedRecipientIds: ['dummy-receiver'], // An array of possible receivers
});

// Starts the sender's loop
sender.start();
