import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"
import { DropdownControl } from "../controls/DropdownControl"

export class EditorOscillatorNode extends Classic.Node<{ baseFrequency: Classic.Socket, frequency: Classic.Socket }, { signal: Classic.Socket }, { waveform: DropdownControl }> {
	width = 180
	height = 200
	constructor(change?: () => void) {
		super('Oscillator');

		let baseFreqInput = new Classic.Input(socket, "Base Frequency", false);
		baseFreqInput.addControl(new LabeledInputControl(440, "Base Frequency", change))
		this.addInput("baseFrequency", baseFreqInput);

		let freqInput = new Classic.Input(socket, 'Additional Frequency', true);
		this.addInput("frequency", freqInput);

		this.addOutput("signal", new Classic.Output(socket, "Signal"))

		const dropdownOptions = [
			{ value: "sine", label: "sine" },
			{ value: "sawtooth", label: "sawtooth" },
			{ value: "triangle", label: "triangle" },
			{ value: "square", label: "square" },
		]

		this.addControl("waveform", new DropdownControl(dropdownOptions, undefined, change))
	}

	data(inputs: { baseFrequency?: AudioNode[], frequency?: AudioNode[] }): { signal: AudioNode } {
		const osc = audioCtx.createOscillator();
		osc.type = this.controls.waveform.value?.toString() as OscillatorType || "sine"
		const bfreqControl = this.inputs["baseFrequency"]?.control;

		if (inputs.baseFrequency) {
			osc.frequency.setValueAtTime(0.01, audioCtx.currentTime);
			inputs.baseFrequency[0].connect(osc.frequency);
		} else {
			osc.frequency.setValueAtTime((bfreqControl as LabeledInputControl).value || 440, audioCtx.currentTime);
		}

		if (inputs.frequency) {
			inputs.frequency.forEach(itm => { console.log(itm); itm.connect(osc.frequency) });
		}

		audioSources.push(osc);
		audioSourceStates.push(false);
		return {
			signal: osc
		}
	}
}