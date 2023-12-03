import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"

export class EditorGainNode extends Classic.Node<{ signal: Classic.Socket, baseGain: Classic.Socket, additionalGain: Classic.Socket }, { signal: Classic.Socket }, {}> {
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