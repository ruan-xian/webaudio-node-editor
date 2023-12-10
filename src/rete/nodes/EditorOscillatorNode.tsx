import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"
import { DropdownControl } from "../controls/DropdownControl"
import { processBundledSignal } from "../utils"

export class EditorOscillatorNode extends Classic.Node<{ baseFrequency: Classic.Socket, frequency: Classic.Socket }, { signal: Classic.Socket }, { waveform: DropdownControl }> {
	width = 180
	height = 210
	constructor(change: () => void, initial?: { baseFreq: number, waveform: string }) {
		super('Oscillator');

		let baseFreqInput = new Classic.Input(socket, "Base Frequency", false);
		baseFreqInput.addControl(new LabeledInputControl(initial ? initial.baseFreq : 440, "Base Frequency", change))
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

		this.addControl("waveform", new DropdownControl(change, dropdownOptions, initial ? initial.waveform : undefined))
	}

	data(inputs: { baseFrequency?: AudioNode[][], frequency?: AudioNode[][] }): { signal: AudioNode[] } {
		const bfreqControl = this.inputs["baseFrequency"]?.control;
		const baseFrequency = processBundledSignal(inputs.baseFrequency)
		const frequency = processBundledSignal(inputs.frequency)
		const oscType = this.controls.waveform.value?.toString() as OscillatorType || "sine"

		function getOscNode(baseFrequency: AudioNode[], frequency: AudioNode[]) {
			const osc = audioCtx.createOscillator();
	
			if (baseFrequency.length > 0) {
				osc.frequency.setValueAtTime(0.01, audioCtx.currentTime);
				baseFrequency[0].connect(osc.frequency);
			} else {
				osc.frequency.setValueAtTime((bfreqControl as LabeledInputControl).value || 440, audioCtx.currentTime);
			}
	
			if (frequency.length > 0) {
				frequency.forEach(itm => itm.connect(osc.frequency));
			}

			osc.type = oscType;
			
			return osc;
		}

		const outputs: AudioNode[] = []

		for (const bf of baseFrequency) {
			for (const f of frequency) {
				const osc = getOscNode(bf, f);
				audioSources.push(osc);
				audioSourceStates.push(false);
				outputs.push(osc)
			}
		}
		return {
			signal: outputs
		}
	}

	serialize() {
		return {
			baseFreq: (this.inputs.baseFrequency?.control as LabeledInputControl).value,
			waveform: this.controls.waveform.value
		}
	}
}