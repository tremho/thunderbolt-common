export declare function getAppPath(): Promise<string>;
export declare function readFileText(pathName: string): Promise<string>;
export declare function fileExists(pathName: string): Promise<boolean>;
export declare function readFileArrayBuffer(pathName: string): Promise<Uint8Array>;
export declare function writeFileText(pathName: string, text: string): Promise<void>;
export declare function writeFileArrayBuffer(pathName: string, data: ArrayBuffer): Promise<void>;
export declare function fileDelete(pathName: string): Promise<void>;
export declare function fileMove(pathName: string, newPathName: string): Promise<void>;
export declare function fileRename(pathName: string, newBase: string): Promise<void>;
export declare function fileCopy(pathName: string, toPathName: string): Promise<void>;
export declare class FileDetails {
    parentPath: string;
    fileName: string;
    mtimeMs: number;
    size: number;
    type: string;
}
export declare function fileStats(pathName: string): Promise<FileDetails>;
export declare function createFolder(pathName: string): Promise<void>;
export declare function removeFolder(pathName: string, andClear: boolean): Promise<void>;
export declare function readFolder(pathName: string): Promise<FileDetails[]>;
export declare class UserPathInfo {
    home: string;
    cwd: string;
    assets: string;
    appData: string;
    documents: string;
    downloads: string;
    desktop: string;
    userName: string;
    uid: Number | undefined;
    gid: Number | undefined;
}
export declare function getUserAndPathInfo(): Promise<UserPathInfo>;
