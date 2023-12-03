import { ClassicPreset as Classic } from "rete"
import { socket, audioCtx, audioSources, audioSourceStates } from "../default"

export class EditorConstantNode extends Classic.Node<{}, { value: Classic.Socket }, { value: Classic.InputControl<"number", number> }> {
	width = 180
	height = 120
	constructor(initial: number, change?: (value: number) => void) {
	  super('Constant');
  
	  this.addOutput('value', new Classic.Output(socket, 'Number'));
	  this.addControl(
		'value',
		new Classic.InputControl('number', { initial, change })
	  );
	}
  
	data(): { value: AudioNode } {
	  const constantNode = audioCtx.createConstantSource();
	  const val = this.controls.value.value || 1;
	  constantNode.offset.setValueAtTime(val, audioCtx.currentTime);
  
	  audioSources.push(constantNode);
	  audioSourceStates.push(false);
  
	  return {
		value: constantNode
	  }
	}
  }