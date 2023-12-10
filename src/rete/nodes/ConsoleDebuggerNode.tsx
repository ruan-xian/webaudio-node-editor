import { ClassicPreset as Classic } from "rete"
import { socket } from "../default"

export class ConsoleDebuggerNode extends Classic.Node<{ signal: Classic.Socket }, {}, {}> {
	width = 180
	height = 80
	constructor() {
		super('Console Debugger')

		this.addInput('signal', new Classic.Input(socket, 'Signal', true));
	}

	data(inputs: { signal?: AudioNode[][] }): { value: boolean } {
		if (inputs) {
			console.log(inputs)
		}

		return {
			value: true
		}
	}

	serialize() {
		return {}
	}
}