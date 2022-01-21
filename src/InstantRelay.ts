
import type {
  NodeFactory,
  Message,
  AddNodeOpts,
  InternalNode,
} from './types';

import { makeNode } from './node';

export class InstantRelay<M extends Message> {

  private readonly nodes: Record<string, InternalNode<M>>;

  constructor() {
    this.nodes = Object.create(null);
  }

  addNode<O>(
    id: string,
    factory: NodeFactory<M, O>,
    opts: AddNodeOpts & O,
  ) {
    if (this.nodes[id]) {
      throw new Error(`id "${id}" already in use`)
    }
    this.nodes[id] = makeNode<M, O>(this.nodes, id, factory, opts);
  }

}
