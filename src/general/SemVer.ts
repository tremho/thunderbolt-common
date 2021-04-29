/*
Todo: look into the SemVer class I did for OpenCar
 */

export class SemVer {
    private major?:number;
    private minor?:number;
    private revision?: number;
    private patch?: number;
    private release?: string;
    private comment?: string;

    public static fromString(svString:string): SemVer {
        try {
            const parts = svString.split('.', 4)
            const maj = parseInt(parts[0])
            const min = parseInt(parts[1])
            const rev = parseInt(parts[2])
            let patch = parts[3]
            let release, comment;
            let ci = patch.indexOf('+')
            if (ci !== -1) {
                comment = patch.substring(ci + 1)
                patch = patch.substring(0, ci)
            }
            let ri = patch.indexOf('-')
            if (ri !== -1) {
                release = patch.substring(ri + 1)
                patch = patch.substring(0, ri)
            }
            const patchNum = parseInt(patch)
            return new SemVer(maj, min, rev, patchNum, release, comment)
        } catch(e) {
            console.error(`Error parsing SemVer string ${svString}`,e)
        }
        return new SemVer(0)
    }
    constructor(stringOrMaj:string | number, min?:number, rev?:number, patch?:number, release?:string, comment?:string) {
        if(typeof stringOrMaj === 'string') {
            return SemVer.fromString(stringOrMaj as string)
        }
        this.major = stringOrMaj as number;
        this.minor = min;
        this.revision = rev;
        this.release = release;
        this.comment = comment;
    }
}

export default SemVer;

