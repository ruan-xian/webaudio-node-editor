import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
type NoiseType = "White Noise" | "Brown Noise"

export class EditorNoiseNode extends Classic.Node<{}, { signal: Classic.Socket }, {}> {
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