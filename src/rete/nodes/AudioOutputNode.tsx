import { ClassicPreset as Classic } from "rete"
import { socket, globalGain, audioCtx } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"
import { VisualizerControl } from "../controls/VisualizerControl"

export class AudioOutputNode extends Classic.Node<{ signal: Classic.Socket }, {}, {}> {
  width = 180
  height = 140
  constructor(change: () => void) {
    super('Audio Output');

    this.addInput('signal', new Classic.Input(socket, 'Signal', true));

  }

  data(inputs: { signal?: AudioNode[] }): { value: boolean } {
    let val = false
    if (inputs.signal) {
      val = true
      inputs.signal.forEach(itm => itm.connect(globalGain));
    }
    return {
      value: val
    }
  }

  serialize() {
    return {};
  }
}

export class UniversalOutputNode extends Classic.Node<{ signal: Classic.Socket }, {}, { gain: LabeledInputControl, timeVisualizer: VisualizerControl, freqVisualizer: VisualizerControl }> {
  width = 400
  height = 370
  public timeAnalyserNode = audioCtx.createAnalyser()
  public freqAnalyserNode = audioCtx.createAnalyser()

  constructor(change: () => void, initial?: { gain: number }) {
    super('Universal Output');

    this.addInput('signal', new Classic.Input(socket, 'Signal', true));
    this.addControl(
      'gain',
      new LabeledInputControl(initial ? initial.gain : 1, "Gain", change)
    );

    this.addControl(
      'timeVisualizer',
      new VisualizerControl(this.timeAnalyserNode, false)
    );
    this.addControl(
      'freqVisualizer',
      new VisualizerControl(this.freqAnalyserNode, true)
    );
  }

  data(inputs: { signal?: AudioNode[] }): { value: boolean } {
    const gain = audioCtx.createGain()
    gain.gain.value = this.controls.gain.value

    let val = false
    if (inputs.signal) {
      val = true
      inputs.signal.forEach(itm => {
        itm.connect(gain);
      });
    }
    gain.connect(globalGain)
    gain.connect(this.timeAnalyserNode)
    gain.connect(this.freqAnalyserNode)
    return {
      value: val
    }
  }

  serialize() {
    return {
      gain: this.controls.gain.value
    }
  }
}