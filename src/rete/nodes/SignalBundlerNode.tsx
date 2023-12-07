import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { processBundledSignal } from "../utils";

export class SignalBundlerNode extends Classic.Node<{ signal: Classic.Socket }, { signal: Classic.Socket }, {}> {
	width = 180
	height = 120
	constructor() {
		super('Signal Bundler');

		this.addInput("signal", new Classic.Input(socket, "Signals", true));

		this.addOutput("signal", new Classic.Output(socket, "Bundled Signal"));
	}

	data(inputs: { signal?: AudioNode[][][] }): { signal: AudioNode[][] } {
		const signal = processBundledSignal(inputs.signal);
		const outputs: AudioNode[][] = []

		for (const s of signal) {
			outputs.push(s.flat())
		}
		return {
			signal: outputs
		}
	}

	serialize() {
		return {}
	}
}

export class SignalFlattenerNode extends Classic.Node<{ signal: Classic.Socket }, { signal: Classic.Socket }, {}> {
	width = 180
	height = 120
	constructor() {
		super('Signal Flattener');

		this.addInput("signal", new Classic.Input(socket, "Bundled Signal", false));

		this.addOutput("signal", new Classic.Output(socket, "Flattened Signal"));
	}

	data(inputs: { signal?: AudioNode[][][] }): { signal: AudioNode[][] } {
		const signal = processBundledSignal(inputs.signal);
		const outputs: AudioNode[] = []

		for (const s of signal) {
			const sumNode = audioCtx.createGain()
			s.forEach(itm => itm.connect(sumNode))
			outputs.push(sumNode)
		}
		return {
			signal: [outputs]
		}
	}

	serialize() {
		return {}
	}
}