
import type {
  NodeFactory,
  Message,
  AddNodeOpts,
  InternalNode,
} from './types';
import { crashWithError } from './utils';
import { makeNode } from './node';

export class InstantRelay<M extends Message> {

  private readonly nodes: Map<string, InternalNode<M>>;

  constructor() {
    this.nodes = new Map();
  }

  addNode<O>(
    id: string,
    factory: NodeFactory<M, O>,
    opts: AddNodeOpts & O,
  ) {
    if (this.nodes.has(id)) {
      crashWithError(new Error(`id "${id}" already in use`));
    }
    this.nodes.set(id, makeNode<M, O>(this.nodes, id, factory, opts));
  }

}
