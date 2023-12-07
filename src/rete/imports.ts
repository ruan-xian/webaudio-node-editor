import { Connection, Context } from "./default";
import { EditorOscillatorNode } from './nodes/EditorOscillatorNode';
import { EditorNoiseNode } from './nodes/EditorNoiseNode';
import { EditorGainNode } from './nodes/EditorGainNode';
import { AudioOutputNode, UniversalOutputNode } from './nodes/AudioOutputNode';
import { EditorConstantNode } from './nodes/EditorConstantNode';
import { TimeDomainVisualizerNode, FrequencyDomainVisualizerNode } from './nodes/VisualizerNodes';
import { EditorBiquadNode } from './nodes/EditorBiquadNode';
import { ClipNode } from './nodes/ClipNode';
import { NoteFrequencyNode } from "./nodes/NoteFrequencyNode";
import { SignalBundlerNode, SignalFlattenerNode } from "./nodes/SignalBundlerNode";

export async function createNode(
  { editor, area, dataflow, process }: Context,
  name: string,
  data: any
) {
	switch(name) {
		case "Audio Output":
			return new AudioOutputNode(process);
		case "Universal Output":
			return new UniversalOutputNode(process, data);
		case "Clip Signal":
			return new ClipNode(process, data);
		case "Biquad Filter":
			return new EditorBiquadNode(process, data);
		case "Constant":
			return new EditorConstantNode(process, data);
		case "Gain":
			return new EditorGainNode(process, data);
		case "Noise":
			return new EditorNoiseNode(process, data);
		case "Oscillator":
			return new EditorOscillatorNode(process, data);
    case "Note Frequency":
      return new NoteFrequencyNode(process, data);
    case "Time Domain Visualizer":
      return new TimeDomainVisualizerNode();
    case "Frequency Domain Visualizer":
      return new FrequencyDomainVisualizerNode();
    case "Signal Bundler":
      return new SignalBundlerNode();
    case "Signal Flattener":
      return new SignalFlattenerNode();
		default:
			throw new Error("Unsupported node");
	}
}

export async function importEditor(context: Context, data: any) {
  const { nodes, connections } = data;

  for (const n of nodes) {
    const node = await createNode(context, n.name, n.data);
    node.id = n.id;
    await context.editor.addNode(node);
  }
  for (const c of connections) {
    const source = context.editor.getNode(c.source);
    const target = context.editor.getNode(c.target);

    if (
      source &&
      target &&
      (source.outputs as any)[c.sourceOutput] &&
      (target.inputs as any)[c.targetInput]
    ) {
      const conn = new Connection(
        source,
        c.sourceOutput as never,
        target,
        c.targetInput as never
      );

      await context.editor.addConnection(conn);
    }
  }
}

export function exportEditor(context: Context) {
  const nodes = [];
  const connections = [];

  for (const n of context.editor.getNodes()) {
    nodes.push({
      id: n.id,
      name: n.label,
      data: n.serialize()
    });
  }
  for (const c of context.editor.getConnections()) {
    connections.push({
      source: c.source,
      sourceOutput: c.sourceOutput,
      target: c.target,
      targetInput: c.targetInput
    });
  }

  return {
    nodes,
    connections
  };
}