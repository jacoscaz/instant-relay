
const {InstantRelay} = require('../dist/index.js');
const {InternalMessage} = require('../dist/internalMessage.js');
const expect = require('chai').expect;
const DummyCommunicator = require('./DummyCommunicator');

describe('InstantRelay', () => {
  let ir, dummyReceiver1, dummyReceiver2;

  beforeEach( ()=> {
    ir = new InstantRelay();
    dummyReceiver1 = new DummyCommunicator('receiver1');
    dummyReceiver2 = new DummyCommunicator('receiver2');

  });

  it('should work', async () => {
    const dummySender = new DummyCommunicator('sender1', ir.getSend());
    const dummyReceiver3 = new DummyCommunicator('receiver3');
    const dummyReceiver4 = new DummyCommunicator('receiver4');

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
      dummyReceiver2,
      dummyReceiver3,
      dummyReceiver4,
    );

    ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds: ['receiver1', 'receiver2', 'receiver3', 'receiver4'],
    });

    let counter = 0;
    const dummyElaborate = (msg, callback) => {
      msg.logger.info(msg);
      counter += 1;
      callback();
    };
    dummyReceiver1.elaborate = dummyElaborate;
    dummyReceiver2.elaborate = dummyElaborate;
    dummyReceiver3.elaborate = dummyElaborate;
    dummyReceiver4.elaborate = dummyElaborate;

    await dummySender.send(new InternalMessage('sender1'));
    counter.should.be.equal(4);
  });

  it('should work if getSend has a recipient id not wired', async () => {
    const dummySender = new DummyCommunicator('sender1', ir.getSend(['mocked-id', 'receiver1']));

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
      dummyReceiver2
    );

    ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds: ['receiver1', 'receiver2'],
    });

    let counter = 0;
    const dummyElaborate = (msg) => {
      msg.logger.info(msg);
      counter += 1;
    };
    dummyReceiver1.elaborate = dummyElaborate;
    dummyReceiver2.elaborate = dummyElaborate;

    await dummySender.send(new InternalMessage('sender1'));
    counter.should.be.equal(1);
  });

});

describe('registerIRNodes', () => {
  let ir, dummySender;

  beforeEach( ()=> {
    ir = new InstantRelay();
    dummySender = new DummyCommunicator('sender1', ir.getSend());
  });

  it('should register one node', async () => {

    ir.registerIRNodes(
      dummySender,
    );

    expect(ir['nodes']).to.have.own.property('sender1');
  });

  it('should register more than one node', async () => {
    const dummyReceiver1 = new DummyCommunicator('receiver1');
    const dummyReceiver2 = new DummyCommunicator('receiver2');

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
      dummyReceiver2,
    );

    expect(ir['nodes']).to.have.own.property('sender1');
    expect(ir['nodes']).to.have.own.property('receiver1');
    expect(ir['nodes']).to.have.own.property('receiver2');
  });
});

describe('wireCommunication', () => {
  let ir, dummySender, dummyReceiver1;

  beforeEach( ()=> {
    ir = new InstantRelay();
    dummySender = new DummyCommunicator('sender1', ir.getSend());
    dummyReceiver1 = new DummyCommunicator('receiver1');
  });

  it('should wire communication to one receiver', async () => {

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
    );

    const allowedRecipientIds = ['receiver1'];

    ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds,
    });

    expect(ir['queues']).to.have.own.property('sender1');
    expect(ir['queues']['sender1'].find((item)=> allowedRecipientIds.includes(item.recipientId))).not.to.be.undefined;
  });

  it('should wire communication for more than one receiver', async () => {
    const ir = new InstantRelay();
    const dummyReceiver2 = new DummyCommunicator('receiver2');
    const dummyReceiver3 = new DummyCommunicator('receiver3');

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
      dummyReceiver2,
      dummyReceiver3,
    );

    const allowedRecipientIds = ['receiver1', 'receiver2', 'receiver3'];

    ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds,
    });

    expect(ir['queues']).to.have.own.property('sender1');
    expect(ir['queues']['sender1'].find((item)=> allowedRecipientIds.includes(item.recipientId))).not.to.be.undefined;

  });

  it('should throw an error when trying to wire a node not registered', async () => {

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
    );

    const allowedRecipientIds = ['receiver1', 'receiver3'];

    expect(()=> ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds,
    })).to.throw();
  });

  it('should throw an error when trying to initialize queues for a node whose queues have already been initialized', async () => {

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
    );

    const allowedRecipientIds = ['receiver1'];

    ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds,
    });

    expect(()=> ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds,
    })).to.throw();
  });
});

describe('unwireCommunication', () => {

  const ir = new InstantRelay();
  const dummySender = new DummyCommunicator('sender1', ir.getSend());
  const dummyReceiver1 = new DummyCommunicator('receiver1');
  const dummyReceiver2 = new DummyCommunicator('receiver2');

  it('should unwire communication', async () => {

    ir.registerIRNodes(
      dummySender,
      dummyReceiver1,
      dummyReceiver2
    );

    const allowedRecipientIds = ['receiver1', 'receiver2'];

    ir.wireCommunication({
      senderId: 'sender1',
      allowedRecipientIds,
    });

    ir.unwireCommunication('sender1')

    expect(ir['queues']).not.to.have.own.property('sender1');
    expect(ir['queues']).to.be.empty;
  });
});
