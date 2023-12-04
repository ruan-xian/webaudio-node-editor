import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
import { DropdownControl } from "../controls/DropdownControl"

export class EditorNoiseNode extends Classic.Node<{}, { signal: Classic.Socket }, { noiseType: DropdownControl}> {
  width = 180
  height = 130
  constructor(change: () => void, initial?: {noiseType: string}) {
    super("Noise");
    const dropdownOptions = [
			{ value: "White Noise", label: "White Noise" },
			{ value: "Brown Noise", label: "Brown Noise" },
		]
    this.addControl("noiseType", new DropdownControl(change, dropdownOptions, initial ? initial.noiseType : "White Noise"))
    this.addOutput("signal", new Classic.Output(socket, "Signal"))
  }

  data(): { signal: AudioNode } {
    const noiseSource = audioCtx.createBufferSource();
    var bufferSize = 10 * audioCtx.sampleRate;
    var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var output = noiseBuffer.getChannelData(0);

    if (this.controls.noiseType.value === "White Noise") {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (this.controls.noiseType.value === "Brown Noise") {
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

  serialize() {
    return {
      noiseType: this.controls.noiseType.value
    }
  }
}