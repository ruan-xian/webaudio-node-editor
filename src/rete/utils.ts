import { BaseSchemes, NodeEditor, NodeId } from "rete";

export async function removeConnections(
  editor: NodeEditor<BaseSchemes>,
  nodeId: NodeId
) {
  for (const c of [...editor.getConnections()]) {
    if (c.source === nodeId || c.target === nodeId) {
      await editor.removeConnection(c.id);
    }
  }
}

export async function clearEditor(editor: NodeEditor<BaseSchemes>) {
  for (const c of [...editor.getConnections()]) {
    await editor.removeConnection(c.id);
  }
  for (const n of [...editor.getNodes()]) {
    await editor.removeNode(n.id);
  }
}

// export const cartesian = <T,>(sets: T[][]) =>
//     sets.reduce<T[][]>((accSets, set) => accSets.flatMap(accSet => set.map(value => [...accSet, value])), [[]]);

export const cartesian = <T extends unknown[]>(a: { [K in keyof T]: T[K][] }) => a.reduce<T[]>((b, c) => b.flatMap((d) => c.map((e) => [...d, e] as T)), [[]] as unknown as T[]);

export function processBundledSignal(input?: AudioNode[][]) {
  return input ? cartesian(input) : [[]]
}