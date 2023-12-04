import { Presets } from "rete-react-plugin";
import { css } from "styled-components";

const OutputStyle = css<{ selected?: boolean }>`
  background: #e3e3e388;
  border-color: white;
`;

const SourceStyle = css<{ selected?: boolean }>`
  background: #a3a3a388;
  border-color: white;
`;

const ModifierStyle = css<{ selected?: boolean }>`
  background: #c3c3c388;
  border-color: white;
`;

export function OutputNodeStyle(props: any) {
// eslint-disable-next-line
  return <Presets.classic.Node styles={() => OutputStyle} {...props} />;
}
export function SourceNodeStyle(props: any) {
// eslint-disable-next-line
  return <Presets.classic.Node styles={() => SourceStyle} {...props} />;
}
export function ModifierNodeStyle(props: any) {
// eslint-disable-next-line
  return <Presets.classic.Node styles={() => ModifierStyle} {...props} />;
}