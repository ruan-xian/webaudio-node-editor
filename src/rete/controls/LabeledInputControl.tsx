import { ClassicPreset as Classic } from "rete"
import { Presets } from 'rete-react-plugin';
export class LabeledInputControl extends Classic.InputControl<"number"> {
	constructor(public value: number, public label: string, change?: () => void) {
		super("number", { initial: value, change })
	}
}

export function CustomLabeledInputControl(props: { data: LabeledInputControl }) {
	return (<div><div style={{ padding: "5px 6px"}}>{props.data.label}</div>{Presets.classic.Control({ data: props.data })}</div>);
}
