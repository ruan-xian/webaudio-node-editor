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
import { AudioOutputNode, UniversalOutputNode } from './nodes/AudioOutputNode';
import { EditorConstantNode } from './nodes/EditorConstantNode';
import { TimeDomainVisualizerNode, FrequencyDomainVisualizerNode } from './nodes/VisualizerNodes';
import { EditorBiquadNode } from './nodes/EditorBiquadNode';
import { ClipNode } from './nodes/ClipNode';
import { NoteFrequencyNode } from './nodes/NoteFrequencyNode';

import { ModifierNodeStyle, OutputNodeStyle, SourceNodeStyle } from './styles/nodestyles';
import { CustomConnection } from './styles/connectionstyles';
import { SmoothZoom } from './smoothzoom';

import { importEditor, exportEditor } from './imports';
import { clearEditor } from './utils';
import { CustomSocket } from './styles/socketstyles';

import brookExample from './examples/brook.json';
import amfmExample from './examples/amfm.json'
import jetEngineExample from './examples/jetengine.json'
import chordExample from './examples/chord.json'
import { CustomContextMenu } from './styles/contextstyles';

const examples: { [key in string]: any } = {
  "Babbling Brook (HW3)": brookExample,
  "AM+FM Synthesis": amfmExample,
  "Jet Engine": jetEngineExample,
  "Chord": chordExample
}

type SourceNode =
  | EditorConstantNode
  | EditorOscillatorNode
  | EditorNoiseNode
  | NoteFrequencyNode

const sourceNodeTypes = [EditorConstantNode, EditorOscillatorNode, EditorNoiseNode, NoteFrequencyNode]

type ModifierNode =
  | EditorGainNode
  | EditorBiquadNode
  | ClipNode

const modifierNodeTypes = [EditorGainNode, EditorBiquadNode, ClipNode]

type OutputNode =
  | UniversalOutputNode
  | AudioOutputNode
  | TimeDomainVisualizerNode
  | FrequencyDomainVisualizerNode

const outputNodeTypes = [UniversalOutputNode, AudioOutputNode, TimeDomainVisualizerNode, FrequencyDomainVisualizerNode]

type Node =
  | SourceNode
  | ModifierNode
  | OutputNode;

type Conn = Connection<Node, Node>
export type Schemes = GetSchemes<Node, Conn>;

export class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> { }

export type Context = {
  process: () => void;
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, any>;
  dataflow: DataflowEngine<Schemes>;
};

type AreaExtra = Area2D<Schemes> | ReactArea2D<Schemes> | ContextMenuExtra;

export const socket = new Classic.Socket('socket');

export const audioCtx = new window.AudioContext();
export const globalGain = audioCtx.createGain();
const globalCompressor = audioCtx.createDynamicsCompressor();
globalGain.connect(globalCompressor).connect(audioCtx.destination);
export const audioSources: AudioScheduledSourceNode[] = [];
export const audioSourceStates: boolean[] = []

export function initAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    process();
  } else {
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
      ["Constant", () => new EditorConstantNode(process)],
      ["Note Frequency", () => new NoteFrequencyNode(process)],
      ["Oscillator", () => new EditorOscillatorNode(process)],
      ["Gain", () => new EditorGainNode(process)],
      ["Biquad Filter", () => new EditorBiquadNode(process)],
      ["Clip", () => new ClipNode(process)],
      ["Noise", () => new EditorNoiseNode(process, { noiseType: "White Noise" })],
      ["Outputs",
        [["Universal Output", () => new UniversalOutputNode(process)],
        ["Audio Output", () => new AudioOutputNode(process)],
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
    accumulating: {
      active: () => false
    }
  });
  AreaExtensions.showInputControl(area);

  editor.use(area);
  editor.use(engine);

  area.use(reactRender);
  area.use(contextMenu);
  area.use(connection);
  area.use(arrange);

  area.area.setZoomHandler(new SmoothZoom(0.4, 200, "cubicBezier(.45,.91,.49,.98)", area));

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
      },
      node(context) {
        if (outputNodeTypes.some((c) => context.payload instanceof c)) {
          return OutputNodeStyle;
        }
        if (sourceNodeTypes.some((c) => context.payload instanceof c)) {
          return SourceNodeStyle;
        }
        if (modifierNodeTypes.some((c) => context.payload instanceof c)) {
          return ModifierNodeStyle;
        }
        if (context.payload instanceof Classic.Node) {
          return Presets.classic.Node;
        }
        return null;
      },
      connection(context) {
        return CustomConnection;
      },
      socket(context) {
        return CustomSocket;
      }
    }
  }));
  reactRender.addPreset(Presets.contextMenu.setup({ customize: CustomContextMenu, delay: 200 }));

  const osc = new EditorOscillatorNode(process);
  const gain = new EditorGainNode(process, { gain: 0.5 });
  const output = new UniversalOutputNode(process);

  await editor.addNode(osc);
  await editor.addNode(gain);
  await editor.addNode(output);

  var c = new Connection<Node, Node>(osc, 'signal' as never, gain, 'signal' as never)

  await editor.addConnection(c);
  await editor.addConnection(new Connection<Node, Node>(gain, 'signal' as never, output, 'signal' as never));

  await arrange.layout({ applier: undefined });
  AreaExtensions.zoomAt(area, editor.getNodes());

  await editor.removeConnection(c.id);

  process();

  const context: Context = {
    process: process,
    editor: editor,
    area: area,
    dataflow: engine,
  };

  async function loadEditor(data: any) {
    await clearEditor(editor);
    await importEditor(context, data);
    await arrange.layout({ applier: undefined });
    AreaExtensions.zoomAt(area, editor.getNodes());
  }
  async function loadExample(exampleName: string) {
    await loadEditor(examples[exampleName]);
  }
  async function saveEditor() {
    var data = exportEditor(context);
    await arrange.layout({ applier: undefined });
    AreaExtensions.zoomAt(area, editor.getNodes());
    return data;
  }
  const fileOptions = {
    types: [
      {
        description: 'JSON files',
        accept: {
          "text/plain": ".json" as `.${string}`,
        },
      },
    ],
  };
  async function importEditorFromFile() {
    var fileHandle;
    try {
      [fileHandle] = await window.showOpenFilePicker(fileOptions);
    } catch (e) {
      return;
    }
    const file = await fileHandle.getFile();
    const contents = await file.text();
    await loadEditor(JSON.parse(contents))
  }
  async function exportEditorToFile() {
    var data = await saveEditor();
    async function getNewFileHandle() {
      const handle = await window.showSaveFilePicker(fileOptions);
      return handle;
    }

    async function writeFile(fileHandle: any, contents: any) {
      // Create a FileSystemWritableFileStream to write to.
      const writable = await fileHandle.createWritable();
      // Write the contents of the file to the stream.
      await writable.write(contents);
      // Close the file and write the contents to disk.
      await writable.close();
    }

    try {
      var hdl = await getNewFileHandle();
    } catch (e) {
      return;
    }
    writeFile(hdl, JSON.stringify(data));
  }

  return {
    layout: async (animate: boolean) => {
      await arrange.layout({ applier: animate ? applier : undefined });
      AreaExtensions.zoomAt(area, editor.getNodes());
    },
    exportEditorToFile,
    importEditorFromFile,
    clearEditor: () => clearEditor(editor),
    destroy: () => area.destroy(),
    getExamples() { return Object.keys(examples) },
    loadExample
  };
}
