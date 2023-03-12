"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathUtils = exports.getRemoteSetters = exports.PathParts = void 0;
class PathParts {
    constructor() {
        this.root = '';
        this.dir = '';
        this.base = '';
        this.name = '';
        this.ext = '';
    }
}
exports.PathParts = PathParts;
let platform = 'posix';
let currentWorkingDirectory;
let homeDirectory;
let resourcePath;
let appDataPath;
let documentsPath;
let downloadsPath;
let desktopPath;
// system calls here at setup
function setPlatform(plat) {
    // console.log('setting plat to ', plat)
    platform = plat;
}
// system calls here at setup
function setCurrentWorkingDirectory(cwd) {
    // console.log('setting cwd to ', cwd)
    currentWorkingDirectory = cwd;
}
// system calls here at setup
function setHomeDirectory(userDir) {
    // console.log('setting home to ', userDir)
    homeDirectory = userDir;
}
// system calls here at setup
function setAssetsDirectory(path) {
    // console.log('setting assets to ', path)
    resourcePath = path;
}
function setAppDataDirectory(path) {
    // console.log('setting appData to ', path)
    appDataPath = path;
}
function setDocumentsDirectory(path) {
    // console.log('setting documents to ', path)
    documentsPath = path;
}
function setDownloadsDirectory(path) {
    // console.log('setting downloads to ', path)
    downloadsPath = path;
}
function setDesktopDirectory(path) {
    // console.log('setting desktop to ', path)
    desktopPath = path;
}
// system calls here at setup to get access to path setters
function getRemoteSetters() {
    return {
        setPlatform,
        setCurrentWorkingDirectory,
        setHomeDirectory,
        setAssetsDirectory,
        setAppDataDirectory,
        setDocumentsDirectory,
        setDownloadsDirectory,
        setDesktopDirectory
    };
}
exports.getRemoteSetters = getRemoteSetters;
const posix = {
    get delimiter() { return ':'; },
    get sep() { return '/'; },
    dirname(path) {
        let n = path.lastIndexOf(posix.sep);
        return path.substring(0, n);
    },
    basename(path) {
        let n = path.lastIndexOf(posix.sep);
        return path.substring(n);
    },
    format(p) {
        let path = p.dir ? p.dir : p.root;
        if (path.charAt(path.length - 1) !== posix.sep)
            path += posix.sep;
        if (p.dir)
            path += p.dir;
        if (path.charAt(path.length - 1) !== posix.sep)
            path += posix.sep;
        if (p.base) {
            path += p.base;
        }
        else {
            path += p.name;
            if (p.ext.charAt(0) !== '.')
                path += '.';
            path += p.ext;
        }
        return path;
    },
    parse(path) {
        const parts = new PathParts();
        let n = path.lastIndexOf('.');
        if (n !== -1) {
            parts.ext = path.substring(n);
        }
        else {
            n = path.length;
        }
        let i = path.lastIndexOf(posix.sep, n);
        parts.name = path.substring(i + 1, n);
        parts.base = path.substring(i + 1);
        n = path.lastIndexOf(posix.sep, i);
        parts.dir = path.substring(n, i);
        parts.root = path.substring(0, n);
        return parts;
    },
    isAbsolute(path) {
        return (posix.parse(path).root !== '');
    },
    join(...paths) {
        let result = '';
        for (let i = 0; i < paths.length; i++) {
            if (i > 0 && result.charAt(result.length - 1) !== posix.sep)
                result += posix.sep;
            result += paths[i];
        }
        return result;
    },
    normalize(path) {
        let segments = path.split(posix.sep);
        let norm = '';
        let f = true;
        while (f) {
            f = false;
            for (let i = 1; i < segments.length; i++) {
                if (segments[i] == '..') {
                    f = true;
                    segments.splice(i - 1, 2);
                }
            }
        }
        for (let i = 0; i < segments.length; i++) {
            if (segments[i] === '~')
                norm = homeDirectory;
            if (segments[i] === '.')
                continue;
            if (i)
                norm += '/';
            norm += segments[i];
        }
        return norm;
    },
    // foo/bar/baz, foo/bar/chi => ../chi
    relative(from, to) {
        let out = '';
        let fsegs = from.split(posix.sep);
        let tsegs = to.split(posix.sep);
        let ci = 0;
        while (fsegs[ci] == tsegs[ci])
            ci++;
        let backs = fsegs.length - ci - 1;
        if (backs)
            out += '../'.repeat(backs);
        while (ci < tsegs.length) {
            if (out.charAt(out.length - 1) !== posix.sep)
                out += posix.sep;
            out += tsegs[ci++];
        }
        return out;
    },
    resolve(...paths) {
        let i = paths.length - 1;
        while (i > 0) {
            if (posix.isAbsolute(paths[i]))
                break;
            i--;
        }
        let rpath = posix.join(...paths.slice(i));
        if (!posix.isAbsolute(rpath)) {
            rpath = currentWorkingDirectory + posix.sep + rpath;
        }
        return rpath;
    }
};
const win32 = {
    get delimiter() {
        return ';';
    },
    get sep() {
        return '\\';
    },
    dirname(path) {
        let n = path.lastIndexOf(win32.sep);
        return path.substring(0, n);
    },
    basename(path) {
        let n = path.lastIndexOf(win32.sep);
        return path.substring(n);
    },
    format(p) {
        let path = p.dir ? p.dir : p.root;
        if (path.charAt(path.length - 1) !== win32.sep)
            path += win32.sep;
        if (p.dir)
            path += p.dir;
        if (path.charAt(path.length - 1) !== win32.sep)
            path += win32.sep;
        if (p.base) {
            path += p.base;
        }
        else {
            path += p.name;
            if (p.ext.charAt(0) !== '.')
                path += '.';
            path += p.ext;
        }
        return path;
    },
    parse(path) {
        const parts = new PathParts();
        let n = path.lastIndexOf('.');
        if (n !== -1) {
            parts.ext = path.substring(n);
        }
        else {
            n = path.length;
        }
        let i = path.lastIndexOf(win32.sep, n);
        parts.name = path.substring(i + 1, n);
        parts.base = path.substring(i + 1);
        n = path.lastIndexOf(win32.sep, i);
        parts.dir = path.substring(n, i);
        parts.root = path.substring(0, n);
        return parts;
    },
    isAbsolute(path) {
        return (win32.parse(path).root !== '');
    },
    join(...paths) {
        let result = '';
        for (let i = 0; i < paths.length; i++) {
            if (i > 0 && result.charAt(result.length - 1) !== win32.sep)
                result += win32.sep;
            result += paths[i];
        }
        return result;
    },
    normalize(path) {
        let segments = path.split(win32.sep);
        let norm = '';
        let f = true;
        while (f) {
            f = false;
            for (let i = 1; i < segments.length; i++) {
                if (segments[i] == '..') {
                    f = true;
                    segments.splice(i - 1, 2);
                }
            }
        }
        for (let i = 0; i < segments.length; i++) {
            if (segments[i] === '~')
                norm = homeDirectory;
            if (segments[i] === '.')
                continue;
            if (i)
                norm += '\\';
            norm += segments[i];
        }
        return norm;
    },
    // foo/bar/baz, foo/bar/chi => ../chi
    relative(from, to) {
        let out = '';
        let fsegs = from.split(win32.sep);
        let tsegs = to.split(win32.sep);
        let ci = 0;
        while (fsegs[ci] == tsegs[ci])
            ci++;
        let backs = fsegs.length - ci - 1;
        if (backs)
            out += '..\\'.repeat(backs);
        while (ci < tsegs.length) {
            if (out.charAt(out.length - 1) !== win32.sep)
                out += win32.sep;
            out += tsegs[ci++];
        }
        return out;
    },
    resolve(...paths) {
        let i = paths.length - 1;
        while (i > 0) {
            if (win32.isAbsolute(paths[i]))
                break;
            i--;
        }
        let rpath = win32.join(...paths.slice(i));
        if (!win32.isAbsolute(rpath)) {
            rpath = currentWorkingDirectory + win32.sep + rpath;
        }
        return rpath;
    }
};
class PathUtils {
    /**
     * Gets the posix version of this API, regardless of the recognized platform
     */
    get posix() { return posix; }
    /**
     * Gets the windows version of this API, regardless of the recognized platform
     */
    get win32() { return win32; }
    /**
     * Returns the path delimiter (as in what separates paths in the path environment variable)
     */
    get delimiter() {
        // @ts-ignore
        return this[platform].delimiter;
    }
    /**
     * Returns the path folder separator (e.g. '/' or '\')
     */
    get sep() {
        // @ts-ignore
        return this[platform].sep;
    }
    /**
     * Returns which platform we are under
     */
    get platform() {
        return platform;
    }
    /**
     * returns the user's home directory
     */
    get home() {
        return homeDirectory;
    }
    /**
     * returns the working directory of the executable
     */
    get cwd() {
        return currentWorkingDirectory;
    }
    /**
     * returns the directory of the assets folder
     * may be undefined if not found in expected location
     */
    get assetsPath() {
        return resourcePath;
    }
    /**
     * returns the directory of the application files
     * may be undefined for Linux, or if not found in expected location
     */
    get appDataPath() {
        return appDataPath;
    }
    /**
     * returns the directory reserved  for user documents
     * may be undefined for Linux, or if not found in expected location
     */
    get documentsPath() {
        return documentsPath;
    }
    /**
     * returns the directory reserved  for user downloads
     * may be undefined for Linux, or if not found in expected location
     */
    get downloadsPath() {
        return downloadsPath;
    }
    /**
     * returns the directory reserved  for system desktop
     * may be undefined for Linux, or if not found in expected location
     */
    get desktopPath() {
        return desktopPath;
    }
    /**
     * Returns the directory of the current path (i.e. no basename)
     * @param path
     */
    dirname(path) {
        // @ts-ignore
        return this[platform].dirname(path);
    }
    /**
     * Returns the basename of the file referenced in this path (i.e. filename w/o extension)
     * @param path
     */
    basename(path) {
        // @ts-ignore
        return this[platform].basename(path);
    }
    /**
     * Returns the extension of the file referenced in this path
     * @param path
     */
    extension(path) {
        // @ts-ignore
        return this[platform].extension(path);
    }
    /**
     * Formats a path from a structured set of properties
     * @param {PathParts} parts
     */
    format(parts) {
        // @ts-ignore
        return this[platform].format(parts);
    }
    /**
     * Deconstructs a path into a structured set of properties
     * @param path
     */
    parse(path) {
        // @ts-ignore
        return this[platform].parse(path);
    }
    isAbsolute(path) {
        // @ts-ignore
        return this[platform].isAbsolute();
    }
    /**
     * Joins path segments with appropriate separator
     * @param paths
     */
    join(...paths) {
        // @ts-ignore
        return this[platform].join(...paths);
    }
    /**
     * Normalize a path to remove redundancies
     * @param path
     */
    normalize(path) {
        // @ts-ignore
        return this[platform].normalize(path);
    }
    /**
     * Construct a relative path from a larger path to subset base
     * @param from
     * @param to
     */
    relative(from, to) {
        // @ts-ignore
        return this[platform].relative(from, to);
    }
    /**
     * Resolve a relative or absolute path into a fully qualified absolute path
     * @param paths
     */
    resolve(...paths) {
        // @ts-ignore
        return this[platform].resolve(...paths);
    }
}
exports.PathUtils = PathUtils;
