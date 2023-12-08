import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { cartesian, processBundledSignal } from "../utils";
import { LabeledInputControl } from "../controls/LabeledInputControl";

export class SignalBundlerNode extends Classic.Node<{ signal: Classic.Socket }, { signal: Classic.Socket }, { bundleWidth: LabeledInputControl, bundleCount: LabeledInputControl}> {
	width = 180
	height = 250
	constructor(private update: (control: LabeledInputControl) => void ) {
		super('Signal Bundler');

		this.addInput("signal", new Classic.Input(socket, "Signals", true));

		this.addOutput("signal", new Classic.Output(socket, "Bundled Signal"));

		this.addControl("bundleWidth", new LabeledInputControl(0, "Out Bundle Width", undefined, true));
		this.addControl("bundleCount", new LabeledInputControl(0, "Out Bundle Count", undefined, true));
	}

	data(inputs: { signal?: AudioNode[][][] }): { signal: AudioNode[][] } {
		const output = processBundledSignal(inputs.signal)
		if (output.length > 0) {
			this.controls.bundleWidth.setValue(output[0].length)
			this.controls.bundleCount.setValue(output.length)
		} else {
			this.controls.bundleWidth.setValue(0)
			this.controls.bundleCount.setValue(0)
		}
		this.update(this.controls.bundleWidth)
		this.update(this.controls.bundleCount)

		return {
			signal: output
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
		const signal = inputs.signal ? inputs.signal[0].flat() : [];

		const sumNode = audioCtx.createGain()

		signal.forEach(itm => itm.connect(sumNode))

		return {
			signal: [[sumNode]]
		}
	}

	serialize() {
		return {}
	}
}

export class BundleDebuggerNode extends Classic.Node<{ signal: Classic.Socket }, {}, { bundleWidth: LabeledInputControl, bundleCount: LabeledInputControl}> {
	width = 180
	height = 210
	constructor(private update: (control: LabeledInputControl) => void ) {
		super('Bundle Debugger');

		this.addInput("signal", new Classic.Input(socket, "Bundled Signal", false));

		this.addControl("bundleWidth", new LabeledInputControl(0, "Bundle Width", undefined, true));
		this.addControl("bundleCount", new LabeledInputControl(0, "Bundle Count", undefined, true));
	}

	data(inputs: { signal?: AudioNode[][][] }): {} {
		if (inputs.signal) {
			this.controls.bundleWidth.setValue(inputs.signal[0][0].length)
			this.controls.bundleCount.setValue(inputs.signal[0].length)
		} else {
			this.controls.bundleWidth.setValue(0)
			this.controls.bundleCount.setValue(0)
		}
		this.update(this.controls.bundleWidth)
		this.update(this.controls.bundleCount)
		return {}
	}

	serialize() {
		return {}
	}
}

export class BundleExtenderNode extends Classic.Node<{ signal: Classic.Socket }, { signal: Classic.Socket }, { bundleWidth: LabeledInputControl, bundleCount: LabeledInputControl}> {
	width = 180
	height = 250
	constructor(private update: (control: LabeledInputControl) => void ) {
		super('Bundle Extender');

		this.addInput("signal", new Classic.Input(socket, "Signals", true));

		this.addOutput("signal", new Classic.Output(socket, "Signal"));

		this.addControl("bundleWidth", new LabeledInputControl(0, "Out Bundle Width", undefined, true));
		this.addControl("bundleCount", new LabeledInputControl(0, "Out Bundle Count", undefined, true));
	}

	data(inputs: { signal?: AudioNode[][][] }): { signal: AudioNode[][] } {
		const output = cartesian(inputs.signal ? inputs.signal : [[]]).map(itm => itm.flat())
		
		if (output.length > 0) {
			this.controls.bundleWidth.setValue(output[0].length)
			this.controls.bundleCount.setValue(output.length)
		} else {
			this.controls.bundleWidth.setValue(0)
			this.controls.bundleCount.setValue(0)
		}
		this.update(this.controls.bundleWidth)
		this.update(this.controls.bundleCount)

		return {
			signal: output
		}
	}

	serialize() {
		return {}
	}
}
