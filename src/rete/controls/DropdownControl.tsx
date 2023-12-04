import {ClassicPreset as Classic} from "rete"
import {Select} from "antd"
import { DefaultOptionType } from 'antd/es/select';

export class DropdownControl extends Classic.InputControl<"text"> {
  constructor(change: () => void, public menuOptions: DefaultOptionType[], initial?: string, public label?: string, ) {
    super("text", { 
      initial: initial ? initial : menuOptions[0]?.value?.toString() || "default", 
      change })
  }
}

export function CustomDropdownControl(props: { data: DropdownControl }) {
  const defaultVal = props.data.menuOptions[0]?.value?.toString() || "default"
  if (props.data.label) {
    return (<div><p>{props.data.label}</p><Select defaultValue={defaultVal} options={props.data.menuOptions} onChange={val => props.data.setValue(val)} style={{ width: 120 }}></Select></div>);
  } else {
    return (<Select defaultValue={defaultVal} options={props.data.menuOptions} onChange={val => props.data.setValue(val)} style={{ width: 120 }}></Select>);
  }
}