export declare class PathParts {
    root: string;
    dir: string;
    base: string;
    name: string;
    ext: string;
}
declare function setPlatform(plat: string): void;
declare function setCurrentWorkingDirectory(cwd: string): void;
declare function setHomeDirectory(userDir: string): void;
declare function setAssetsDirectory(path: string): void;
declare function setAppDataDirectory(path: string): void;
declare function setDocumentsDirectory(path: string): void;
declare function setDownloadsDirectory(path: string): void;
declare function setDesktopDirectory(path: string): void;
export declare function getRemoteSetters(): {
    setPlatform: typeof setPlatform;
    setCurrentWorkingDirectory: typeof setCurrentWorkingDirectory;
    setHomeDirectory: typeof setHomeDirectory;
    setAssetsDirectory: typeof setAssetsDirectory;
    setAppDataDirectory: typeof setAppDataDirectory;
    setDocumentsDirectory: typeof setDocumentsDirectory;
    setDownloadsDirectory: typeof setDownloadsDirectory;
    setDesktopDirectory: typeof setDesktopDirectory;
};
export declare class PathUtils {
    /**
     * Gets the posix version of this API, regardless of the recognized platform
     */
    get posix(): any;
    /**
     * Gets the windows version of this API, regardless of the recognized platform
     */
    get win32(): any;
    /**
     * Returns the path delimiter (as in what separates paths in the path environment variable)
     */
    get delimiter(): string;
    /**
     * Returns the path folder separator (e.g. '/' or '\')
     */
    get sep(): string;
    /**
     * Returns which platform we are under
     */
    get platform(): string;
    /**
     * returns the user's home directory
     */
    get home(): string;
    /**
     * returns the working directory of the executable
     */
    get cwd(): string;
    /**
     * returns the directory of the assets folder
     * may be undefined if not found in expected location
     */
    get assetsPath(): string;
    /**
     * returns the directory of the application files
     * may be undefined for Linux, or if not found in expected location
     */
    get appDataPath(): string;
    /**
     * returns the directory reserved  for user documents
     * may be undefined for Linux, or if not found in expected location
     */
    get documentsPath(): string;
    /**
     * returns the directory reserved  for user downloads
     * may be undefined for Linux, or if not found in expected location
     */
    get downloadsPath(): string;
    /**
     * returns the directory reserved  for system desktop
     * may be undefined for Linux, or if not found in expected location
     */
    get desktopPath(): string;
    /**
     * Returns the directory of the current path (i.e. no basename)
     * @param path
     */
    dirname(path: string): string;
    /**
     * Returns the basename of the file referenced in this path (i.e. filename w/o extension)
     * @param path
     */
    basename(path: string): string;
    /**
     * Returns the extension of the file referenced in this path
     * @param path
     */
    extension(path: string): string;
    /**
     * Formats a path from a structured set of properties
     * @param {PathParts} parts
     */
    format(parts: PathParts): string;
    /**
     * Deconstructs a path into a structured set of properties
     * @param path
     */
    parse(path: string): PathParts;
    isAbsolute(path: string): boolean;
    /**
     * Joins path segments with appropriate separator
     * @param paths
     */
    join(...paths: string[]): string;
    /**
     * Normalize a path to remove redundancies
     * @param path
     */
    normalize(path: string): string;
    /**
     * Construct a relative path from a larger path to subset base
     * @param from
     * @param to
     */
    relative(from: string, to: string): string;
    /**
     * Resolve a relative or absolute path into a fully qualified absolute path
     * @param paths
     */
    resolve(...paths: string[]): string;
}
export {};
