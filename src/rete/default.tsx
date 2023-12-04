import { ClassicPreset as Classic, GetSchemes, NodeEditor } from 'rete';

import { Area2D, AreaPlugin, AreaExtensions, Zoom } from 'rete-area-plugin';
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

import anime from "animejs/lib/anime.es.js";

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

import { OutputNodeStyle, SourceNodeStyle } from './nodestyles';

type SourceNode =
  | EditorConstantNode
  | EditorOscillatorNode
  | EditorNoiseNode

const sourceNodeTypes = [EditorConstantNode, EditorOscillatorNode, EditorNoiseNode]

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
  | Connection<EditorGainNode, UniversalOutputNode>
  | Connection<EditorOscillatorNode, EditorGainNode>
export type Schemes = GetSchemes<Node, Conn>;
class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> { }

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

class SmoothZoom extends Zoom {
  animation?: any;

  screenToArea(x: number, y: number, t: any) {
    const { x: tx, y: ty, k } = t;

    return { x: (x - tx) / k, y: (y - ty) / k };
  }

  areaToScreen(x: number, y: number, t: any) {
    const { x: tx, y: ty, k } = t;

    return { x: x * k + tx, y: y * k + ty };
  }

  constructor(
    intensity: number,
    private duration: number,
    private easing: string,
    private area: AreaPlugin<any, any>
  ) {
    super(intensity);
  }

  wheel = (e: WheelEvent) => {
    e.preventDefault();

    const isNegative = e.deltaY < 0;
    const delta = isNegative ? this.intensity : -this.intensity * 0.75;
    const { left, top } = this.container.getBoundingClientRect();
    const ox = e.clientX - left;
    const oy = e.clientY - top;

    const coords = this.screenToArea(ox, oy, this.area.area.transform);

    const { k } = this.area.area.transform;
    const targets = {
      zoom: k
    };
    const { duration, easing } = this;

    if (this.animation) {
      this.animation.reset();
    }
    this.animation = anime({
      targets,
      x: coords.x,
      y: coords.y,
      zoom: k * (1 + delta),
      duration,
      easing,
      update: () => {
        const currentTransform = this.area.area.transform;

        const coordinates = this.areaToScreen(coords.x, coords.y, currentTransform);

        const nextX = coordinates.x - coords.x * targets.zoom;
        const nextY = coordinates.y - coords.y * targets.zoom;

        this.area.area.zoom(
          targets.zoom,
          nextX - currentTransform.x,
          nextY - currentTransform.y
        );
      }
    });
  };

  dblclick = (e: MouseEvent) => {
    return;
  }

  destroy() {
    super.destroy();
    if (this.animation) {
      this.animation.reset();
    }
  }
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
      ["Biquad Filter", () => new EditorBiquadNode(process)],
      ["Clip", () => new ClipNode(process)],
      ["Noise",
        [["Brown Noise", () => new EditorNoiseNode("Brown Noise")],
        ["White Noise", () => new EditorNoiseNode("White Noise")]]],
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
    accumulating: AreaExtensions.accumulateOnCtrl()
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
        if (context.payload instanceof Classic.Node) {
          return Presets.classic.Node;
        }
        return null;
      }
    }
  }));
  reactRender.addPreset(Presets.contextMenu.setup({ delay: 200 }));

  const osc = new EditorOscillatorNode(process);
  const gain = new EditorGainNode(0.5, process);
  const output = new UniversalOutputNode(process);

  await editor.addNode(osc);
  await editor.addNode(gain);
  await editor.addNode(output);

  var c = new Connection(osc, 'signal', gain, 'signal')

  await editor.addConnection(c);
  await editor.addConnection(new Connection(gain, 'signal', output, 'signal'));

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
