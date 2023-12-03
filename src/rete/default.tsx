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

import { useRef } from 'react';

import { Select } from 'antd';
import { DefaultOptionType } from 'antd/es/select';

type Node = | MyConstantNode | AudioOutputNode | MyOscillatorNode | MyGainNode | TimeDomainVisualizerNode | FrequencyDomainVisualizerNode | MyNoiseNode;
type Conn =
| Connection<MyOscillatorNode, AudioOutputNode> 
| Connection<MyOscillatorNode, MyOscillatorNode> 
| Connection<MyConstantNode, MyOscillatorNode> 
| Connection<MyGainNode, TimeDomainVisualizerNode>
| Connection<MyGainNode, FrequencyDomainVisualizerNode>
| Connection<MyOscillatorNode, MyGainNode>
type Schemes = GetSchemes<Node, Conn>;
class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> { }

class LabeledInputControl extends Classic.InputControl<"number"> {
  constructor(public value: number, public label: string, change?: () => void) {
    super("number", { initial: value, change })
  }
}

function CustomLabeledInputControl(props: { data: LabeledInputControl }) {
  return (<div>{props.data.label}{Presets.classic.Control({ data: props.data })}</div>);
}

class DropdownControl extends Classic.InputControl<"text"> {
  constructor(public menuOptions: DefaultOptionType[], public label?: string, change?: () => void) {
    super("text", { initial: menuOptions[0]?.value?.toString() || "default", change })
  }
}

class VisualizerControl extends Classic.Control {
  constructor(public analyserNode: AnalyserNode, public isFrequencyDomain: boolean) {
    super()
  }
}

function CustomVisualizerOutput(props: { data: VisualizerControl }) {
  const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>

  function draw() {
    requestAnimationFrame(draw);

    if (canvasRef.current) {

      var canvas = canvasRef.current
      var canvasCtx = canvas.getContext("2d");

      if (canvasCtx) {

        if (!props.data.isFrequencyDomain) {
          props.data.analyserNode.fftSize = 2048;
          var bufferLength = props.data.analyserNode.frequencyBinCount;
          var dataArray = new Uint8Array(bufferLength);
          props.data.analyserNode.getByteTimeDomainData(dataArray);
      
          canvasCtx.fillStyle = "white";
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = "rgb(0, 0, 0)";
      
          canvasCtx.beginPath();
      
          var sliceWidth = (canvas.width * 1.0) / bufferLength;
          var x = 0;
      
          for (var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = (v * canvas.height) / 2;
            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
          }
      
          canvasCtx.lineTo(canvas.width, canvas.height / 2);
          canvasCtx.stroke();
        } else {
          // based on code from https://www.telerik.com/blogs/adding-audio-visualization-react-app-using-web-audio-api
          const bucketCt = props.data.analyserNode.frequencyBinCount / 8;
          const fftData = new Uint8Array(bucketCt);
          props.data.analyserNode.maxDecibels = -10;
          props.data.analyserNode.getByteFrequencyData(fftData);
          const bar_spacing = canvas.width / bucketCt;
          const bar_width = bar_spacing;
          const height_mult = canvas.height / 255 * 0.9;
          let start = 0;

          canvasCtx.fillStyle = "white";
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          for (let i = 0; i < fftData.length; i++) {
            start = i * bar_spacing;
            canvasCtx.fillStyle = "black";
            canvasCtx.fillRect(start, canvasRef.current.height, bar_width, height_mult * -fftData[i]);
          }
        }
      }
    }
  }

  draw();

  return (<canvas ref={canvasRef} width={360} height={100}></canvas>)
}

function CustomDropdownControl(props: { data: DropdownControl }) {
  const defaultVal = props.data.menuOptions[0]?.value?.toString() || "default"
  if (props.data.label) {
    return (<div><p>{props.data.label}</p><Select defaultValue={defaultVal} options={props.data.menuOptions} onChange={val => props.data.setValue(val)} style={{ width: 120 }}></Select></div>);
  } else {
    return (<Select defaultValue={defaultVal} options={props.data.menuOptions} onChange={val => props.data.setValue(val)} style={{ width: 120 }}></Select>);
  }
}

class MyOscillatorNode extends Classic.Node<{ baseFrequency: Classic.Socket, frequency: Classic.Socket }, { signal: Classic.Socket }, { waveform: DropdownControl }> {
  width = 180
  height = 200
  constructor(change?: () => void) {
    super('Oscillator');

    let baseFreqInput = new Classic.Input(socket, "Base Frequency", false);
    baseFreqInput.addControl(new LabeledInputControl(440, "Base Frequency", change))
    this.addInput("baseFrequency", baseFreqInput);

    let freqInput = new Classic.Input(socket, 'Additional Frequency', true);
    this.addInput("frequency", freqInput);

    this.addOutput("signal", new Classic.Output(socket, "Signal"))

    const dropdownOptions = [
      { value: "sine", label: "sine" },
      { value: "sawtooth", label: "sawtooth" },
      { value: "triangle", label: "triangle" },
      { value: "square", label: "square" },
    ]

    this.addControl("waveform", new DropdownControl(dropdownOptions, undefined, change))
  }

  data(inputs: { baseFrequency?: AudioNode[], frequency?: AudioNode[] }): { signal: AudioNode } {
    const osc = audioCtx.createOscillator();
    osc.type = this.controls.waveform.value?.toString() as OscillatorType || "sine"
    const bfreqControl = this.inputs["baseFrequency"]?.control;

    if (inputs.baseFrequency) {
      osc.frequency.setValueAtTime(0.01, audioCtx.currentTime);
      inputs.baseFrequency[0].connect(osc.frequency);
    } else {
      osc.frequency.setValueAtTime((bfreqControl as LabeledInputControl).value || 440, audioCtx.currentTime);
    }

    if (inputs.frequency) {
      inputs.frequency.forEach(itm => { console.log(itm); itm.connect(osc.frequency) });
    }

    audioSources.push(osc);
    audioSourceStates.push(false);
    return {
      signal: osc
    }
  }
}

type NoiseType = "White Noise" | "Brown Noise"

class MyNoiseNode extends Classic.Node<{}, { signal: Classic.Socket }, {}> {
  width = 180
  height = 80
  constructor(public noiseType: NoiseType) {
    super(noiseType);
    this.addOutput("signal", new Classic.Output(socket, "Signal"))
  }

  data(): { signal: AudioNode } {
    const noiseSource = audioCtx.createBufferSource();
    var bufferSize = 10 * audioCtx.sampleRate;
    var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var output = noiseBuffer.getChannelData(0);

    if (this.noiseType === "White Noise") {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (this.noiseType === "Brown Noise") {
      var lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        var brown = Math.random() * 2 - 1;
      
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    audioSources.push(noiseSource);
    audioSourceStates.push(false);

    return {
      signal: noiseSource
    }
  }
}

class MyGainNode extends Classic.Node<{ signal: Classic.Socket, baseGain: Classic.Socket, additionalGain: Classic.Socket }, { signal: Classic.Socket }, {}> {
  width = 180
  height = 200
  constructor(initial?: number, change?: () => void) {
    super('Gain');


    let signalInput = new Classic.Input(socket, 'Signal', true);
    this.addInput("signal", signalInput);

    let baseGainInput = new Classic.Input(socket, "Base Gain", false);
    baseGainInput.addControl(new LabeledInputControl(initial || 1, "Base Gain", change))
    this.addInput("baseGain", baseGainInput);

    let gainInput = new Classic.Input(socket, "Additional Gain", true);
    this.addInput("additionalGain", gainInput);

    this.addOutput("signal", new Classic.Output(socket, "Signal"))
  }

  data(inputs: { signal?: AudioNode[], baseGain?: AudioNode[], additionalGain?: AudioNode[] }): { signal: AudioNode } {
    const gainNode = audioCtx.createGain();
    const gainControl = this.inputs["baseGain"]?.control;

    if (inputs.signal) {
      inputs.signal.forEach(itm => itm.connect(gainNode));
    }

    if (inputs.baseGain) {
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      inputs.baseGain[0].connect(gainNode.gain)
    } else {
      gainNode.gain.setValueAtTime((gainControl as LabeledInputControl).value || 1, audioCtx.currentTime);
    }

    if (inputs.additionalGain) {
      inputs.additionalGain.forEach(itm => itm.connect(gainNode.gain));
    }

    return {
      signal: gainNode
    }
  }
}

class AudioOutputNode extends Classic.Node<{ signal: Classic.Socket }, {}, { gain: LabeledInputControl }> {
  width = 180
  height = 140
  constructor(change?: () => void) {
    super('Audio Output');

    this.addInput('signal', new Classic.Input(socket, 'Signal', true));
    this.addControl(
      'gain',
      new LabeledInputControl(1, "Gain", change)
    );
  }

  data(inputs: { signal?: AudioNode[] }): { value: boolean } {
    let val = false
    if (inputs.signal) {
      val = true
      inputs.signal.forEach(itm => itm.connect(globalGain));
    }
    globalGain.gain.value = this.controls.gain.value;
    return {
      value: val
    }
  }
}

class TimeDomainVisualizerNode extends Classic.Node<{ signal: Classic.Socket }, {}, { visualizer: VisualizerControl }> {
  width = 400
  height = 200
  public analyserNode = audioCtx.createAnalyser()
  constructor() {
    super('Time Domain Visualizer')

    this.addInput('signal', new Classic.Input(socket, 'Signal', true));
    this.addControl(
      'visualizer',
      new VisualizerControl(this.analyserNode, false)
    );
  }

  data(inputs: { signal?: AudioNode[] }): { value: AnalyserNode } {
    if (inputs.signal) {
      inputs.signal.forEach(itm => itm.connect(this.analyserNode));
    }
    return {
      value: this.analyserNode
    }
  }
}

class FrequencyDomainVisualizerNode extends Classic.Node<{ signal: Classic.Socket }, {}, { visualizer: VisualizerControl }> {
  width = 400
  height = 200
  public analyserNode = audioCtx.createAnalyser()
  constructor() {
    super('Frequency Domain Visualizer')

    this.addInput('signal', new Classic.Input(socket, 'Signal', true));
    this.addControl(
      'visualizer',
      new VisualizerControl(this.analyserNode, true)
    );
  }

  data(inputs: { signal?: AudioNode[] }): { value: AnalyserNode } {
    if (inputs.signal) {
      inputs.signal.forEach(itm => itm.connect(this.analyserNode));
    }
    return {
      value: this.analyserNode
    }
  }
}

class MyConstantNode extends Classic.Node<{}, { value: Classic.Socket }, { value: Classic.InputControl<"number", number> }> {
  width = 180
  height = 120
  constructor(initial: number, change?: (value: number) => void) {
    super('Constant');

    this.addOutput('value', new Classic.Output(socket, 'Number'));
    this.addControl(
      'value',
      new Classic.InputControl('number', { initial, change })
    );
  }

  data(): { value: AudioNode } {
    const constantNode = audioCtx.createConstantSource();
    const val = this.controls.value.value || 1;
    constantNode.offset.setValueAtTime(val, audioCtx.currentTime);

    audioSources.push(constantNode);
    audioSourceStates.push(false);

    return {
      value: constantNode
    }
  }
}

type AreaExtra = Area2D<Schemes> | ReactArea2D<Schemes> | ContextMenuExtra;

const socket = new Classic.Socket('socket');

const audioCtx = new window.AudioContext();
const globalGain = audioCtx.createGain();
globalGain.gain.value = 0;
const globalCompressor = audioCtx.createDynamicsCompressor();
globalGain.connect(globalCompressor).connect(audioCtx.destination);
let audioSources: AudioScheduledSourceNode[] = [];
let audioSourceStates: boolean[] = []

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
      ["Constant", () => new MyConstantNode(1, process)],
      ["Oscillator", () => new MyOscillatorNode(process)],
      ["Gain", () => new MyGainNode(1, process)],
      ["Noise", 
      [["Brown Noise", () => new MyNoiseNode("Brown Noise")],
      ["White Noise", () => new MyNoiseNode("White Noise")]]],
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

  const osc = new MyOscillatorNode(process);
  const gain = new MyGainNode(0.5, process);
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
