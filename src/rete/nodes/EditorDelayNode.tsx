import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx } from "../default"
import { LabeledInputControl } from "../controls/LabeledInputControl"
import { processBundledSignal } from "../utils"

export class EditorDelayNode extends Classic.Node<{ signal: Classic.Socket, delayTime: Classic.Socket }, { signal: Classic.Socket }, { maxDelay: LabeledInputControl }> {
	width = 180
	height = 240
	constructor(change: () => void, initial?: { delay: number, maxDelay: number }) {
		super('Delay');


		let signalInput = new Classic.Input(socket, 'Signal', true);
		this.addInput("signal", signalInput);

		let delayInput = new Classic.Input(socket, "Delay Time", false);
		delayInput.addControl(new LabeledInputControl(initial ? initial.delay : 1, "Delay Time", change))
		this.addInput("delayTime", delayInput);

		this.addControl("maxDelay", new LabeledInputControl(initial ? initial.maxDelay : 1, "Max Delay", change))

		this.addOutput("signal", new Classic.Output(socket, "Signal"))
	}

	data(inputs: { signal?: AudioNode[][], delayTime?: AudioNode[][] }): { signal: AudioNode[] } {
		const delayControl = this.inputs.delayTime?.control;

		const signal = processBundledSignal(inputs.signal)
		const delay = processBundledSignal(inputs.delayTime)
		const outputs: AudioNode[] = []

		const getDelayNode = (delay: AudioNode[]) => {
			const delayNode = audioCtx.createDelay(Math.max(this.controls.maxDelay.value, 1));

			if (delay.length > 0) {
				delayNode.delayTime.setValueAtTime(0, audioCtx.currentTime)
				delay.forEach(itm => itm.connect(delayNode.delayTime))
			} else {
				delayNode.delayTime.setValueAtTime((delayControl as LabeledInputControl).value || 0, audioCtx.currentTime);
			}

			return delayNode
		}

		for (const inSignal of signal) {
			for (const d of delay) {
				const delayNode = getDelayNode(d)
				inSignal.forEach(itm => itm.connect(delayNode))
				outputs.push(delayNode)
			}
		}

		return {
			signal: outputs
		}
	}

	serialize() {
		return {
			delay: (this.inputs.delayTime?.control as LabeledInputControl).value,
			maxDelay: this.controls.maxDelay.value
		}
	}
}