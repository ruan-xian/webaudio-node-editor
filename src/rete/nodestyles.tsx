import { Presets } from "rete-react-plugin";
import { css } from "styled-components";

const OutputStyle = css<{ selected?: boolean }>`
  background: grey;
`;

const SourceStyle = css<{ selected?: boolean }>`
  background: #77beed;
`;

const ModifierStyle = css<{ selected?: boolean }>`
  background: #4cad5a;
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