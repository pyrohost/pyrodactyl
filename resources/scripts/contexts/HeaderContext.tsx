import type React from "react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

interface HeaderContextType {
	headerActions: ReactNode;
	setHeaderActions: (actions: ReactNode) => void;
	clearHeaderActions: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [headerActions, setHeaderActions] = useState<ReactNode>(null);

	const clearHeaderActions = useCallback(() => setHeaderActions(null), []);

	const contextValue = useMemo(
		() => ({
			headerActions,
			setHeaderActions,
			clearHeaderActions,
		}),
		[headerActions, clearHeaderActions],
	);

	return (
		<HeaderContext.Provider value={contextValue}>
			{children}
		</HeaderContext.Provider>
	);
};

export const useHeader = () => {
	const context = useContext(HeaderContext);
	if (context === undefined) {
		throw new Error("useHeader must be used within a HeaderProvider");
	}
	return context;
};
