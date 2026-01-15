import ConfirmationDialog from "./ConfirmationDialog";
import DialogComponent from "./Dialog";
import DialogFooter from "./DialogFooter";
import DialogIcon from "./DialogIcon";

const Dialog = Object.assign(DialogComponent, {
	Confirm: ConfirmationDialog,
	Footer: DialogFooter,
	Icon: DialogIcon,
});

export { Dialog };
export * from "./context";
export { default as styles } from "./style.module.css";
export * from "./types.d";
