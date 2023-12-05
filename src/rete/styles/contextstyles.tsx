import styled from "styled-components";
import { Presets } from "rete-react-plugin";
import { $contextColor, $contextColorLight, $contextColorDark, $contextWidth } from "./vars";

const { Menu, Common, Search, Item, Subitems } = Presets.contextMenu

const CustomCommon = styled(Common)`
	border-bottom: 1px solid ${$contextColorDark};
	background-color: ${$contextColor};
	&:hover {
	  background-color: ${$contextColorLight};
	}
`

const CustomMenu = styled(Menu)`
  width: ${$contextWidth};
`
const CustomItem = styled(Item)`
  background: ${$contextColor};
  border-bottom: 1px solid ${$contextColorDark};
  &:hover {
	background-color: ${$contextColorLight};
  }
`

const CustomSubitem = styled(Subitems)`
  width: ${$contextWidth};
`

export const CustomContextMenu =
{
	main: () => CustomMenu,
	item: () => CustomItem,
	common: () => CustomCommon,
	search: () => Search,
	subitems: () => CustomSubitem
}