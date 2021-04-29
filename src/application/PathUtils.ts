
export class PathParts {
    root: string = ''
    dir: string = ''
    base: string = ''
    name: string = ''
    ext: string = ''
}

let platform = 'posix'
let currentWorkingDirectory:string
let homeDirectory:string
let appPath:string

function setPlatform(plat:string) {
    platform = plat
}

function setCurrentWorkingDirectory(cwd:string) {
    currentWorkingDirectory = cwd
}

function setHomeDirectory(userDir:string) {
    homeDirectory = userDir
}

function setAppPath(path:string) {
    appPath = path
}


export function getRemoteSetters() {
    return {
        setPlatform,
        setCurrentWorkingDirectory,
        setHomeDirectory,
        setAppPath
    }
}

const posix = {
    get delimiter():string { return ':'},
    get sep():string { return '/'},

    dirname(path:string):string {
        let n = path.lastIndexOf(posix.sep)
        return path.substring(0, n)
    },
    basename(path:string):string {
        let n = path.lastIndexOf(posix.sep)
        return path.substring(n)

    },
    format(p:PathParts):string {
        let path = p.dir ? p.dir : p.root;
        if(path.charAt(path.length - 1) !== posix.sep) path += posix.sep
        if(p.dir) path += p.dir
        if(path.charAt(path.length - 1) !== posix.sep) path += posix.sep
        if(p.base) {
            path += p.base
        } else {
            path += p.name
            if(p.ext.charAt(0) !== '.') path += '.'
            path += p.ext
        }
        return path
    },
    parse(path:string):PathParts {
        const parts = new PathParts()
        let n = path.lastIndexOf('.')
        if(n !== -1) {
            parts.ext = path.substring(n)
        } else {
            n = path.length
        }
        let i = path.lastIndexOf(posix.sep, n)
        parts.name = path.substring(i+1, n)
        parts.base = path.substring(i+1)
        n = path.lastIndexOf(posix.sep, i)
        parts.dir = path.substring(n, i)
        parts.root = path.substring(0, n)

        return parts
    },
    isAbsolute(path:string) {
        return (posix.parse(path).root !== '')
    },
    join(...paths:string[]):string {
        let result = ''
        for (let i = 0; i < paths.length; i++) {
            if (i > 0 && result.charAt(result.length - 1) !== posix.sep) result += posix.sep
            result += paths[i]
        }
        return result
    },

    normalize(path:string):string {
        let segments = path.split(posix.sep)
        let norm = ''
        let f = true
        while(f) {
            f = false
            for(let i=1; i<segments.length; i++) {
                if (segments[i] == '..') {
                    f = true
                    segments.splice(i - 1, 2)
                }
            }
        }
        for(let i = 0; i<segments.length; i++) {
            if(segments[i] === '~') norm = homeDirectory
            if(segments[i] === '.') continue
            if(i) norm += '/'
            norm += segments[i]
        }
        return norm
    },

    // foo/bar/baz, foo/bar/chi => ../chi
    relative(from:string, to:string): string {
        let out = ''
        let fsegs = from.split(posix.sep)
        let tsegs = to.split(posix.sep)
        let ci = 0
        while(fsegs[ci] == tsegs[ci]) ci++
        let backs = fsegs.length - ci - 1
        if(backs) out += '../'.repeat(backs)
        while(ci < tsegs.length) {
            if(out.charAt(out.length-1) !== posix.sep) out += posix.sep
            out += tsegs[ci++]
        }
        return out
    },
    resolve(...paths:string[]):string {
        let i = paths.length -1;
        while(i>0) {
            if(posix.isAbsolute(paths[i])) break;
            i--
        }
        let rpath = posix.join(...paths.slice(i))
        if(!posix.isAbsolute(rpath)) {
            rpath = currentWorkingDirectory + posix.sep + rpath
        }
        return rpath
    }

}
const win32 = {
    get delimiter(): string {
        return ';'
    },
    get sep(): string {
        return '\\'
    },

    dirname(path:string):string {
        let n = path.lastIndexOf(win32.sep)
        return path.substring(0, n)
    },
    basename(path:string):string {
        let n = path.lastIndexOf(win32.sep)
        return path.substring(n)

    },
    format(p:PathParts):string {
        let path = p.dir ? p.dir : p.root;
        if(path.charAt(path.length - 1) !== win32.sep) path += win32.sep
        if(p.dir) path += p.dir
        if(path.charAt(path.length - 1) !== win32.sep) path += win32.sep
        if(p.base) {
            path += p.base
        } else {
            path += p.name
            if(p.ext.charAt(0) !== '.') path += '.'
            path += p.ext
        }
        return path
    },
    parse(path:string):PathParts {
        const parts = new PathParts()
        let n = path.lastIndexOf('.')
        if(n !== -1) {
            parts.ext = path.substring(n)
        } else {
            n = path.length
        }
        let i = path.lastIndexOf(win32.sep, n)
        parts.name = path.substring(i+1, n)
        parts.base = path.substring(i+1)
        n = path.lastIndexOf(win32.sep, i)
        parts.dir = path.substring(n, i)
        parts.root = path.substring(0, n)

        return parts
    },
    isAbsolute(path:string) {
        return (win32.parse(path).root !== '')
    },
    join(...paths:string[]):string {
        let result = ''
        for (let i = 0; i < paths.length; i++) {
            if (i > 0 && result.charAt(result.length - 1) !== win32.sep) result += win32.sep
            result += paths[i]
        }
        return result
    },

    normalize(path:string):string {
        let segments = path.split(win32.sep)
        let norm = ''
        let f = true
        while(f) {
            f = false
            for(let i=1; i<segments.length; i++) {
                if (segments[i] == '..') {
                    f = true
                    segments.splice(i - 1, 2)
                }
            }
        }
        for(let i = 0; i<segments.length; i++) {
            if(segments[i] === '~') norm = homeDirectory
            if(segments[i] === '.') continue
            if(i) norm += '\\'
            norm += segments[i]
        }
        return norm
    },

    // foo/bar/baz, foo/bar/chi => ../chi
    relative(from:string, to:string): string {
        let out = ''
        let fsegs = from.split(win32.sep)
        let tsegs = to.split(win32.sep)
        let ci = 0
        while(fsegs[ci] == tsegs[ci]) ci++
        let backs = fsegs.length - ci - 1
        if(backs) out += '..\\'.repeat(backs)
        while(ci < tsegs.length) {
            if(out.charAt(out.length-1) !== win32.sep) out += win32.sep
            out += tsegs[ci++]
        }
        return out
    },
    resolve(...paths:string[]):string {
        let i = paths.length -1;
        while(i>0) {
            if(win32.isAbsolute(paths[i])) break;
            i--
        }
        let rpath = win32.join(...paths.slice(i))
        if(!win32.isAbsolute(rpath)) {
            rpath = currentWorkingDirectory + win32.sep + rpath
        }
        return rpath
    }
}
export class PathUtils {

    get posix():any { return posix }
    get win32():any { return win32 }

    get delimiter():string {
        // @ts-ignore
        return this[platform].delimiter
    }
    get sep():string {
        // @ts-ignore
        return this[platform].sep
    }
    get platform():string {
        return platform
    }
    get home():string {
        return homeDirectory
    }
    get cwd():string {
        return currentWorkingDirectory
    }
    get appPath():string {
        return appPath
    }

    dirname(path:string) : string {
        // @ts-ignore
        return this[platform].dirname(path)
    }
    basename(path:string) :string {
        // @ts-ignore
        return this[platform].basename(path)
    }
    extension(path:string):string {
        // @ts-ignore
        return this[platform].extension(path)
    }
    format(parts:PathParts):string {
        // @ts-ignore
        return this[platform].format(parts)
    }
    parse(path:string):PathParts {
        // @ts-ignore
        return this[platform].parse(path)
    }
    isAbsolute(path:string): boolean {
        // @ts-ignore
        return this[platform].isAbsolute()
    }
    join(...paths:string[]): string {
        // @ts-ignore
        return this[platform].join(...paths)
    }
    normalize(path:string) : string {
        // @ts-ignore
        return this[platform].normalize(path)
    }
    relative(from:string, to:string) : string {
        // @ts-ignore
        return this[platform].relative(from, to)
    }
    resolve(...paths:string[]) :string {
        // @ts-ignore
        return this[platform].resolve(...paths)
    }
}