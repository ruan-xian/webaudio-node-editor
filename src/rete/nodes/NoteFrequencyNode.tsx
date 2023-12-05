import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
import { DropdownControl } from "../controls/DropdownControl";
import { LabeledInputControl } from "../controls/LabeledInputControl";

export class NoteFrequencyNode extends Classic.Node<{}, { value: Classic.Socket }, { note: DropdownControl, octave: LabeledInputControl }> {
	width = 180
	height = 185
	constructor(change: () => void, initial?: { octave: number, note: string }) {
		super('Note Frequency');

		this.addOutput('value', new Classic.Output(socket, 'Frequency'));

		const dropdownOptions = [
			{ value: "0", label: "A" },
			{ value: "1", label: "A#/B♭" },
			{ value: "2", label: "B" },
			{ value: "3", label: "C" },
			{ value: "4", label: "C#/D♭" },
			{ value: "5", label: "D" },
			{ value: "6", label: "D#/E♭" },
			{ value: "7", label: "E" },
			{ value: "8", label: "F" },
			{ value: "9", label: "F#/G♭" },
			{ value: "10", label: "G" },
			{ value: "11", label: "G#/A♭" },
		]
		this.addControl("note", new DropdownControl(change, dropdownOptions, initial ? initial.note : "0"))

		this.addControl(
			'octave',
			new LabeledInputControl(initial ? initial.octave : 4, "Octave", change)
		);
	}

	data(): { value: AudioNode } {
		const constantNode = audioCtx.createConstantSource();
		const noteVal = Number(this.controls.note.value)
		const octave = this.controls.octave.value || 0
		const val = 440 * Math.pow(2.0, (octave - 4) + (1.0 / 12) * noteVal);

		constantNode.offset.setValueAtTime(val, audioCtx.currentTime);

		audioSources.push(constantNode);
		audioSourceStates.push(false);

		return {
			value: constantNode
		}
	}

	serialize() {
		return {
			octave: this.controls.octave.value,
			note: this.controls.note.value
		}
	}
}