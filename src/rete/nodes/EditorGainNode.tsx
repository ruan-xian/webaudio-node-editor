import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"
import { processBundledSignal } from "../utils"

export class EditorGainNode extends Classic.Node<{ signal: Classic.Socket, baseGain: Classic.Socket, additionalGain: Classic.Socket }, { signal: Classic.Socket }, {}> {
  width = 180
  height = 200
  constructor(change: () => void, initial?: { gain: number }) {
    super('Gain');


    let signalInput = new Classic.Input(socket, 'Signal', true);
    this.addInput("signal", signalInput);

    let baseGainInput = new Classic.Input(socket, "Base Gain", false);
    baseGainInput.addControl(new LabeledInputControl(initial ? initial.gain : 1, "Base Gain", change))
    this.addInput("baseGain", baseGainInput);

    let gainInput = new Classic.Input(socket, "Additional Gain", true);
    this.addInput("additionalGain", gainInput);

    this.addOutput("signal", new Classic.Output(socket, "Signal"))
  }

  data(inputs: { signal?: AudioNode[][], baseGain?: AudioNode[][], additionalGain?: AudioNode[][] }): { signal: AudioNode[] } {
    const gainControl = this.inputs["baseGain"]?.control;

    const signal = processBundledSignal(inputs.signal)
    const baseGain = processBundledSignal(inputs.baseGain)
    const additionalGain = processBundledSignal(inputs.additionalGain)
    const outputs: AudioNode[] = []

    function getGainNode(baseGain: AudioNode[], additionalGain: AudioNode[]) {
      const gainNode = audioCtx.createGain();

      if (baseGain.length > 0) {
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
        baseGain[0].connect(gainNode.gain)
      } else {
        gainNode.gain.setValueAtTime((gainControl as LabeledInputControl).value || 0, audioCtx.currentTime);
      }

      if (additionalGain.length > 0) {
        additionalGain.forEach(itm => itm.connect(gainNode.gain));
      }

      return gainNode
    }

    for (const inSignal of signal) {
      for (const bg of baseGain) {
        for (const ag of additionalGain) {
          const gainNode = getGainNode(bg, ag)
          inSignal.forEach(itm => itm.connect(gainNode))
          outputs.push(gainNode)
        }
      }
    }

    return {
      signal: outputs
    }
  }

  serialize() {
    return {
      gain: (this.inputs.baseGain?.control as LabeledInputControl).value
    }
  }
}