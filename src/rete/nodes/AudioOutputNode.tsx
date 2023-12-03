import { ClassicPreset as Classic } from "rete"
import { socket, globalGain } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"

export class AudioOutputNode extends Classic.Node<{ signal: Classic.Socket }, {}, { gain: LabeledInputControl }> {
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