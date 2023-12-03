import { ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete';

import { Area2D, AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';

import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
  ArrangeAppliers
} from "rete-auto-arrange-plugin";

import {
  ReactPlugin,
  ReactArea2D,
  //Presets as ReactPresets,
  Presets,
} from 'rete-react-plugin';
import { createRoot } from 'react-dom/client';

import { DataflowEngine } from 'rete-engine'; import {
  ContextMenuExtra,
  ContextMenuPlugin,
  Presets as ContextMenuPresets
} from "rete-context-menu-plugin";


import { DropdownControl, CustomDropdownControl } from './controls/DropdownControl';
import { LabeledInputControl, CustomLabeledInputControl } from './controls/LabeledInputControl';
import { VisualizerControl, CustomVisualizerOutput } from './controls/VisualizerControl';
import { EditorOscillatorNode } from './nodes/EditorOscillatorNode';
import { EditorNoiseNode } from './nodes/EditorNoiseNode';
import { EditorGainNode } from './nodes/EditorGainNode';
import { AudioOutputNode } from './nodes/AudioOutputNode';
import { EditorConstantNode } from './nodes/EditorConstantNode';
import { TimeDomainVisualizerNode, FrequencyDomainVisualizerNode } from './nodes/VisualizerNodes';

type Node = | EditorConstantNode | AudioOutputNode | EditorOscillatorNode | EditorGainNode | TimeDomainVisualizerNode | FrequencyDomainVisualizerNode | EditorNoiseNode;
type Conn =
| Connection<EditorOscillatorNode, AudioOutputNode> 
| Connection<EditorOscillatorNode, EditorOscillatorNode> 
| Connection<EditorConstantNode, EditorOscillatorNode> 
| Connection<EditorGainNode, TimeDomainVisualizerNode>
| Connection<EditorGainNode, FrequencyDomainVisualizerNode>
| Connection<EditorOscillatorNode, EditorGainNode>
type Schemes = GetSchemes<Node, Conn>;
class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> { }

type AreaExtra = Area2D<Schemes> | ReactArea2D<Schemes> | ContextMenuExtra;

export const socket = new Classic.Socket('socket');

export const audioCtx = new window.AudioContext();
export const globalGain = audioCtx.createGain();
globalGain.gain.value = 0;
const globalCompressor = audioCtx.createDynamicsCompressor();
globalGain.connect(globalCompressor).connect(audioCtx.destination);
export const audioSources: AudioScheduledSourceNode[] = [];
export const audioSourceStates: boolean[] = []

export function initAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    process();
  } else {
    globalGain.gain.value = 0;
    audioCtx.suspend();
  }
}

function reInitOscillators() {
  for (let i = 0; i < audioSources.length; i++) {
    if (!audioSourceStates[i]) {
      audioSources[i].start()
      audioSourceStates[i] = true
    }
  }
}

function killOscillators() {
  for (let i = 0; i < audioSources.length; i++) {
    if (audioSourceStates[i]) {
      audioSources[i].stop()
      audioSourceStates[i] = false
    }
  }
  audioSources.length = 0
  audioSourceStates.length = 0
}

const editor = new NodeEditor<Schemes>();
const engine = new DataflowEngine<Schemes>();

function process() {
  engine.reset();

  killOscillators();

  editor
    .getNodes()
    .forEach((n) => engine.fetch(n.id));

  setTimeout(reInitOscillators, 100);
}

export async function createEditor(container: HTMLElement) {

  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const reactRender = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  const arrange = new AutoArrangePlugin<Schemes>();
  arrange.addPreset(ArrangePresets.classic.setup());

  const applier = new ArrangeAppliers.TransitionApplier<Schemes, never>({
    duration: 500,
    timingFunction: (t) => t,
    async onTick() {
      await AreaExtensions.zoomAt(area, editor.getNodes());
    }
  });



  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ["Constant", () => new EditorConstantNode(1, process)],
      ["Oscillator", () => new EditorOscillatorNode(process)],
      ["Gain", () => new EditorGainNode(1, process)],
      ["Noise", 
      [["Brown Noise", () => new EditorNoiseNode("Brown Noise")],
      ["White Noise", () => new EditorNoiseNode("White Noise")]]],
      ["Outputs", 
      [["AudioOutput", () => new AudioOutputNode(process)],
      ["Time Domain Visualizer", () => new TimeDomainVisualizerNode()],
      ["Frequency Domain Visualizer", () => new FrequencyDomainVisualizerNode()]]]
    ])
  });


  editor.addPipe((context) => {
    if (["connectioncreated", "connectionremoved"].includes(context.type)) {
      setTimeout(process, 10);
      //process();
    }
    return context;
  });

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });
  AreaExtensions.showInputControl(area);

  editor.use(area);
  editor.use(engine);

  area.use(reactRender);
  area.use(contextMenu);
  area.use(connection);
  area.use(arrange);

  connection.addPreset(ConnectionPresets.classic.setup());
  reactRender.addPreset(Presets.classic.setup({
    customize: {
      control(data) {
        if (data.payload instanceof VisualizerControl) {
          return CustomVisualizerOutput;
        }
        if (data.payload instanceof LabeledInputControl) {
          return CustomLabeledInputControl;
        }
        if (data.payload instanceof DropdownControl) {
          return CustomDropdownControl;
        }
        if (data.payload instanceof Classic.InputControl) {
          return Presets.classic.Control;
        }
        return null;
      }
    }
  }));
  reactRender.addPreset(Presets.contextMenu.setup({ delay: 200 }));

  const osc = new EditorOscillatorNode(process);
  const gain = new EditorGainNode(0.5, process);
  const visualizer = new TimeDomainVisualizerNode();
  const freqVisualizer = new FrequencyDomainVisualizerNode();
  const output = new AudioOutputNode(process);

  await editor.addNode(osc);
  await editor.addNode(gain);
  await editor.addNode(visualizer);
  await editor.addNode(freqVisualizer);
  await editor.addNode(output);

  var c = new Connection(osc, 'signal', gain, 'signal')

  await editor.addConnection(c);
  await editor.addConnection(new Connection(gain, 'signal', visualizer, 'signal'));
  await editor.addConnection(new Connection(gain, 'signal', output, 'signal'));
  await editor.addConnection(new Connection(gain, 'signal', freqVisualizer, 'signal'));

  await arrange.layout({ applier });
  AreaExtensions.zoomAt(area, editor.getNodes());

  await editor.removeConnection(c.id);

  process()

  return {
    layout: async (animate: boolean) => {
      await arrange.layout({ applier: animate ? applier : undefined });
      AreaExtensions.zoomAt(area, editor.getNodes());
    },
    destroy: () => area.destroy(),
  };
}
