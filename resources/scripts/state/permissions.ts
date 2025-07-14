export interface PanelPermissions {
    [key: string]: {
        description: string;
        keys: { [k: string]: string };
    };
}
