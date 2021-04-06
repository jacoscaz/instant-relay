# Instant Relay

A convenient library to create local networks of worker modules, written in TypeScript, running in Node.js.


## Features

- **Typed**. This is a TypeScript project. No need to install external typings.
- **Pluggable** nodes. You chose which modules to include in your project, Instant Relay provides just the API to allow easy inter-module communication.
- **Fast** inter-module communication provided by the very performant [fastq](https://www.npmjs.com/package/fastq) module.
- Full **back-pressure management** along the chain of connected modules.
- **Simple** internal logic.
- **Easy** to use.
- **Expandable**: write your own worker module by implementing the provided interface.
- Use in your **TypeScript** or **Javascript** project.
- Easy **logging** and tracing: each message embeds an instance of [pino](https://www.npmjs.com/package/pino) (the fastest logger around), so that you have to simply call `msg.logger.info('Hello')` to keep track of your message moving around the network.

## Requirements

Node.js v14 LTS (14.15.1) or later.

## Install

by using `npm`:
```bash
$ npm install instant-relay
```

by using `yarn`:

```bash
$ yarn add instant-relay
```

## Contributing

Contributions are very welcome and wanted.

To submit your custom hook, please make sure your read our [CONTRIBUTING](./CONTRIBUTING.md) guidelines.

**Before submitting** a new merge request, please make sure:

1. You have updated the package.json version and reported your changes into the [CHANGELOG](./CHANGELOG.md) file
2. make sure you run `npm test` and `npm build` before submitting your merge request.

### Credits

This library is provided and sponsored by:

<div>
  <p>
    <a href="https://beautifulinteractions.com/">
      <img src="https://beautifulinteractions.com/img/logo-colorful.svg" alt="Beautiful interactions" width="140px" />
    </a>
  </p>
</div>

As part of our commitment to support and contribute to the open source community.

## License
Licensed under [MIT](./LICENSE).
