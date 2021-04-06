class DummyCommunicator {
  constructor(id, send) {
    this.id = id;
    this.send = send;
  }

  elaborate(msg, cb) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`[${this.id}] Elaborating message ${JSON.stringify(msg, null, 2)}`);
    cb();
  }
}

module.exports = DummyCommunicator;
