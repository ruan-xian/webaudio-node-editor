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
