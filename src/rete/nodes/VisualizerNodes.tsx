import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { VisualizerControl } from "../controls/VisualizerControl"

export class TimeDomainVisualizerNode extends Classic.Node<{ signal: Classic.Socket }, {}, { visualizer: VisualizerControl }> {
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

	data(inputs: { signal?: AudioNode[][][] }): { value: AnalyserNode } {
		if (inputs.signal) {
			inputs.signal.forEach(sigBundle => 
				sigBundle.forEach(sig => sig.forEach(itm => itm.connect(this.analyserNode))));
		}
		return {
			value: this.analyserNode
		}
	}

	serialize() {
		return {}
	}
}

export class FrequencyDomainVisualizerNode extends Classic.Node<{ signal: Classic.Socket }, {}, { visualizer: VisualizerControl }> {
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

	data(inputs: { signal?: AudioNode[][][] }): { value: AnalyserNode } {
		if (inputs.signal) {
			inputs.signal.forEach(sigBundle => 
				sigBundle.forEach(sig => sig.forEach(itm => itm.connect(this.analyserNode))));
		}
		return {
			value: this.analyserNode
		}
	}

	serialize() {
		return {}
	}
}
