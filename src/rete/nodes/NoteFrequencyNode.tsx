import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
import { DropdownControl } from "../controls/DropdownControl";
import { LabeledInputControl } from "../controls/LabeledInputControl";
import { processBundledSignal } from "../utils";

export class NoteFrequencyNode extends Classic.Node<{}, { value: Classic.Socket }, { note: DropdownControl, octave: LabeledInputControl }> {
	width = 180
	height = 185
	constructor(change: () => void, initial?: { octave: number, note: string }) {
		super('Note Frequency');

		this.addOutput('value', new Classic.Output(socket, 'Frequency'));

		const dropdownOptions = [
			{ value: "0", label: "C" },
			{ value: "1", label: "C#/D♭" },
			{ value: "2", label: "D" },
			{ value: "3", label: "D#/E♭" },
			{ value: "4", label: "E" },
			{ value: "5", label: "F" },
			{ value: "6", label: "F#/G♭" },
			{ value: "7", label: "G" },
			{ value: "8", label: "G#/A♭" },
			{ value: "9", label: "A" },
			{ value: "10", label: "A#/B♭" },
			{ value: "11", label: "B" },
		]
		this.addControl("note", new DropdownControl(change, dropdownOptions, initial ? initial.note : "9"))

		this.addControl(
			'octave',
			new LabeledInputControl(initial ? initial.octave : 4, "Octave", change)
		);
	}

	data(): { value: AudioNode[][] } {
		const constantNode = audioCtx.createConstantSource();
		const noteVal = Number(this.controls.note.value)
		const octave = this.controls.octave.value || 0
		const val = 261.625565300598634 * Math.pow(2.0, (octave - 4) + (1.0 / 12) * noteVal);

		constantNode.offset.setValueAtTime(val, audioCtx.currentTime);

		audioSources.push(constantNode);
		audioSourceStates.push(false);

		return {
			value: [[constantNode]]
		}
	}

	serialize() {
		return {
			octave: this.controls.octave.value,
			note: this.controls.note.value
		}
	}
}

export class TransposeNode extends Classic.Node<{ signal: Classic.Socket }, { signal: Classic.Socket }, { halfstep: LabeledInputControl, octave: LabeledInputControl }> {
	width = 180
	height = 240
	constructor(change: () => void, initial?: { halfstep: number, octave: number }) {
		super('Transpose');

		this.addInput('signal', new Classic.Input(socket, "Frequency"))

		this.addOutput('signal', new Classic.Output(socket, 'Transposed Frequency'));

		this.addControl("halfstep", new LabeledInputControl(initial ? initial.halfstep : 0, "Halfstep difference", change))

		this.addControl(
			'octave',
			new LabeledInputControl(initial ? initial.octave : 0, "Octave difference", change)
		);
	}

	data(inputs: { signal?: AudioNode[][][]}): { signal: AudioNode[][] } {
		const signal = processBundledSignal(inputs.signal);
		const halfstep = this.controls.halfstep.value || 0;
		const octave = this.controls.octave.value || 0;

		const outputs: AudioNode[] = []

		for (const s of signal) {
			const gainNode = audioCtx.createGain();
			const val = Math.pow(2.0, octave + (1.0 / 12) * halfstep);
			gainNode.gain.value = val;
			s.forEach(itm => itm.connect(gainNode));
			outputs.push(gainNode);
		}

		return {
			signal: [outputs]
		}
	}

	serialize() {
		return {
			octave: this.controls.octave.value,
			halfstep: this.controls.halfstep.value
		}
	}
}