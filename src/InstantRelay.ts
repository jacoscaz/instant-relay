
import type { NodeFactory, AddNodeOpts, InternalNode, } from './types';
import { makeNode } from './node';

export class InstantRelay<M> {

  readonly nodeMap: Map<string, InternalNode<M>>;
  readonly nodeArr: InternalNode<M>[];

  constructor() {
    this.nodeMap = new Map();
    this.nodeArr = [];
  }

  addNode<O extends {}>(
    id: string,
    factory: NodeFactory<M, O>,
    opts: AddNodeOpts & O,
  ) {
    makeNode<M, O>(this.nodeMap, this.nodeArr, id, factory, opts);
  }

}
