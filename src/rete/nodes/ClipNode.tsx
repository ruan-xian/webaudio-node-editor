import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"

export class ClipNode extends Classic.Node<{ signal: Classic.Socket }, { signal: Classic.Socket }, { amp: LabeledInputControl }> {
	width = 180
	height = 170
	constructor(change: () => void, initial?: { amp: number }) {
		super('Clip Signal');


		let signalInput = new Classic.Input(socket, 'Signal', true);
		this.addInput("signal", signalInput);

		this.addControl("amp", new LabeledInputControl(initial ? initial.amp : 1, "Amplitude cutoff", change));

		this.addOutput("signal", new Classic.Output(socket, "Signal"))
	}

	data(inputs: { signal?: AudioNode[] }): { signal: AudioNode } {
		const amp = this.controls.amp.value || 1;

		const gain1 = audioCtx.createGain();
		gain1.gain.value = 1. / amp;
		const waveShaper = new WaveShaperNode(audioCtx, {
			curve: new Float32Array([-amp, amp])
		});

		if (inputs.signal) {
			inputs.signal.forEach(itm => itm.connect(gain1));
		}

		gain1.connect(waveShaper);

		return {
			signal: waveShaper
		}
	}

	serialize() {
		return {
			amp: this.controls.amp.value
		}
	}
}