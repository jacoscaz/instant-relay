
const {InternalMessage} = require('../dist/internalMessage.js');
const should = require('chai').should();

describe('InternalMessage', () => {

  it('should set and get payload correctly', async () => {
    const msg = new InternalMessage('sender1');

    msg.setPayload('lorem ipsum');

    msg.getPayload().should.be.equal('lorem ipsum');
  });

});
