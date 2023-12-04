import { Presets } from "rete-react-plugin";
import { css } from "styled-components";

const OutputStyle = css<{ selected?: boolean }>`
  background: grey;
`;

const SourceStyle = css<{ selected?: boolean }>`
  background: #4cad5a;
`;

export function OutputNodeStyle(props: any) {
  return <Presets.classic.Node styles={() => OutputStyle} {...props} />;
}
export function SourceNodeStyle(props: any) {
  return <Presets.classic.Node styles={() => SourceStyle} {...props} />;
}