import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"
import { DropdownControl } from "../controls/DropdownControl"
import { processBundledSignal } from "../utils"

const EPSILON = 0.00001

export function initKeyboardHandlers() {
	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
}

function keyDown(event: KeyboardEvent) {
	const key = event.code;
	if (keyboardFrequencyMap[key] && !keyHoldStates[key]) {
		playNote(key);
		keyHoldStates[key] = true;
	} else if (event.shiftKey) {
		sustaining = true
	}
}

function keyUp(event: KeyboardEvent) {
	const key = event.code;
	if (keyboardFrequencyMap[key] && keyHoldStates[key]) {
		if (!sustaining) {
			releaseNote(key);
		}

		keyHoldStates[key] = false;
	} else if (!event.shiftKey) {
		sustaining = false;

		for (var k in keyboardFrequencyMap) {
			if (!keyHoldStates[k]) {
				releaseNote(k);
			}
		}
	}
}

function playNote(key: string) {
	function applyADSR(gainNode: GainNode, profile: ADSR_Profile) {
		gainNode.gain.cancelAndHoldAtTime(audioCtx.currentTime);
		if (gainNode.gain.value < EPSILON) {
			gainNode.gain.value = EPSILON;
		}

		profile.attack = (profile.attack < EPSILON) ? EPSILON : profile.attack
		profile.decay = (profile.decay < EPSILON) ? EPSILON : profile.decay
		profile.sustain = (profile.sustain < EPSILON) ? EPSILON : profile.sustain

		var runningTime = profile.attackLength;
		gainNode.gain.exponentialRampToValueAtTime(profile.attack, audioCtx.currentTime + runningTime);

		runningTime += profile.decayLength;
		gainNode.gain.exponentialRampToValueAtTime(profile.decay, audioCtx.currentTime + runningTime);

		runningTime += profile.sustainLength;
		gainNode.gain.exponentialRampToValueAtTime(profile.sustain, audioCtx.currentTime + runningTime);

		runningTime += profile.releaseLength;
		gainNode.gain.exponentialRampToValueAtTime(EPSILON, audioCtx.currentTime + runningTime);
	}

	for (var i = 0; i < keyboardGainNodes[key].length && i < keyboardADSRProfiles.length; i++) {
		applyADSR(keyboardGainNodes[key][i], keyboardADSRProfiles[i]);
	}
}

function releaseNote(key: string) {
	function applyADSR(gainNode: GainNode, profile: ADSR_Profile) {
		gainNode.gain.cancelAndHoldAtTime(audioCtx.currentTime);
		if (gainNode.gain.value < EPSILON) {
			gainNode.gain.value = 0;
			return;
		}

		gainNode.gain.exponentialRampToValueAtTime(EPSILON, audioCtx.currentTime + profile.releaseLength);
		gainNode.gain.setValueAtTime(0, audioCtx.currentTime + profile.releaseLength);
	}

	for (var i = 0; i < keyboardGainNodes[key].length && i < keyboardADSRProfiles.length; i++) {
		applyADSR(keyboardGainNodes[key][i], keyboardADSRProfiles[i]);
	}
}

export function initKeyboard() {
	for (const k in keyboardFrequencyMap) {
		if (keyboardGainNodes[k]) {
			keyboardGainNodes[k].length = 0
		} else {
			keyboardGainNodes[k] = []
		}
		keyHoldStates[k] = false
		sustaining = false
	}
	keyboardADSRProfiles.length = 0
}

const keyboardGainNodes: { [Key: string]: GainNode[] } = {}
const keyboardADSRProfiles: ADSR_Profile[] = []
const keyHoldStates: { [Key: string]: boolean } = {}
var sustaining = false

type ADSR_Profile = { attack: number, attackLength: number, decay: number, decayLength: number, sustain: number, sustainLength: number, releaseLength: number }

export class KeyboardNoteNode extends Classic.Node<{additionalFrequency: Classic.Socket},
	{ signal: Classic.Socket },
	{
		waveform: DropdownControl, halfstep: LabeledInputControl, octave: LabeledInputControl,
		attack: LabeledInputControl,
		attackLength: LabeledInputControl,
		decay: LabeledInputControl,
		decayLength: LabeledInputControl,
		sustain: LabeledInputControl,
		sustainLength: LabeledInputControl,
		releaseLength: LabeledInputControl
	}> {
	width = 180
	height = 720
	constructor(change: () => void, initial?: { halfstep: number, octave: number, waveform: string, adsrProfile: ADSR_Profile }) {
		super('Keyboard Note');

		this.addOutput("signal", new Classic.Output(socket, "Signal"))

		const dropdownOptions = [
			{ value: "sine", label: "sine" },
			{ value: "sawtooth", label: "sawtooth" },
			{ value: "triangle", label: "triangle" },
			{ value: "square", label: "square" },
		]

		this.addInput("additionalFrequency", new Classic.Input(socket, "Additional Frequency"))

		this.addControl("waveform", new DropdownControl(change, dropdownOptions, initial ? initial.waveform : undefined))

		this.addControl("halfstep", new LabeledInputControl(initial ? initial.halfstep : 0, "Halfstep difference", change))

		this.addControl(
			'octave',
			new LabeledInputControl(initial ? initial.octave : 0, "Octave difference", change)
		);
		
		this.addControl("attack", new LabeledInputControl(initial ? initial.adsrProfile.attack : 0.8, "Attack Amplitude", change))
		this.addControl("attackLength", new LabeledInputControl(initial ? initial.adsrProfile.attackLength : 0.05, "Attack Length", change))
		this.addControl("decay", new LabeledInputControl(initial ? initial.adsrProfile.decay : 0.7, "Decay Amplitude", change))
		this.addControl("decayLength", new LabeledInputControl(initial ? initial.adsrProfile.decayLength : 0.1, "Decay Length", change))
		this.addControl("sustain", new LabeledInputControl(initial ? initial.adsrProfile.sustain : 0.1, "Sustain Amplitude", change))
		this.addControl("sustainLength", new LabeledInputControl(initial ? initial.adsrProfile.sustainLength : 3, "Sustain Length", change))
		this.addControl("releaseLength", new LabeledInputControl(initial ? initial.adsrProfile.releaseLength : 1, "Release Length", change))
	}

	data(inputs: {additionalFrequency: AudioNode[][]}): { signal: AudioNode[] } {
		const frequency = processBundledSignal(inputs.additionalFrequency)
		const oscType = this.controls.waveform.value?.toString() as OscillatorType || "sine"
		const halfstep = this.controls.halfstep.value || 0;
		const octave = this.controls.octave.value || 0;

		function getCompositeNode(baseFrequency: number, additionalFrequency: AudioNode[]) {
			const osc = audioCtx.createOscillator();
			osc.frequency.setValueAtTime(baseFrequency * Math.pow(2.0, octave + (1.0 / 12) * halfstep), audioCtx.currentTime);
			additionalFrequency.forEach(itm => itm.connect(osc.frequency))
			osc.type = oscType;

			const gainNode = audioCtx.createGain();
			gainNode.gain.value = 0;
			osc.connect(gainNode);
			audioSources.push(osc);
			audioSourceStates.push(false);

			return gainNode;
		}

		const outputs: AudioNode[] = []

		for (const k in keyboardFrequencyMap) {
			for (const f of frequency) {
				const gNode = getCompositeNode(keyboardFrequencyMap[k], f)
				keyboardGainNodes[k].push(gNode)
				outputs.push(gNode)
			}
		}
		keyboardADSRProfiles.push(
			{
				attack: this.controls.attack.value,
				attackLength: this.controls.attackLength.value,
				decay: this.controls.decay.value,
				decayLength: this.controls.decayLength.value,
				sustain: this.controls.sustain.value,
				sustainLength: this.controls.sustainLength.value,
				releaseLength: this.controls.releaseLength.value,
			}
		)
		return {
			signal: outputs
		}
	}

	serialize() {
		return {
			octave: this.controls.octave.value,
			halfstep: this.controls.halfstep.value,
			waveform: this.controls.waveform.value,
			adsrProfile: {
				attack: this.controls.attack.value,
				attackLength: this.controls.attackLength.value,
				decay: this.controls.decay.value,
				decayLength: this.controls.decayLength.value,
				sustain: this.controls.sustain.value,
				sustainLength: this.controls.sustainLength.value,
				releaseLength: this.controls.releaseLength.value,
			}
		}
	}
}

const keyboardFrequencyMap: { [Key: string]: number } = {
	KeyZ: 261.625565300598634, //Z - C
	KeyS: 277.182630976872096, //S - C#
	KeyX: 293.66476791740756, //X - D
	KeyD: 311.12698372208091, //D - D#
	KeyC: 329.627556912869929, //C - E
	KeyV: 349.228231433003884, //V - F
	KeyG: 369.994422711634398, //G - F#
	KeyB: 391.995435981749294, //B - G
	KeyH: 415.304697579945138, //H - G#
	KeyN: 440.0, //N - A
	KeyJ: 466.163761518089916, //J - A#
	KeyM: 493.883301256124111, //M - B
	KeyQ: 523.251130601197269, //Q - C
	Digit2: 554.365261953744192, //2 - C#
	KeyW: 587.32953583481512, //W - D
	Digit3: 622.253967444161821, //3 - D#
	KeyE: 659.255113825739859, //E - E
	KeyR: 698.456462866007768, //R - F
	Digit5: 739.988845423268797, //5 - F#
	KeyT: 783.990871963498588, //T - G
	Digit6: 830.609395159890277, //6 - G#
	KeyY: 880.0, //Y - A
	Digit7: 932.327523036179832, //7 - A#
	KeyU: 987.766602512248223, //U - B
	KeyI: 1046.5022612, //I - C
};