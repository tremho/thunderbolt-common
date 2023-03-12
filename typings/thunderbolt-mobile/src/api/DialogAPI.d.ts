export declare class DialogOptions {
    title?: string;
    message?: string;
    detail?: string;
    type: string;
    buttons?: string[];
    selectedButtonIndex?: number;
}
export declare function openDialog(dialogOptions: DialogOptions): Promise<number>;
