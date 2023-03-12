export declare class SemVer {
    private major?;
    private minor?;
    private revision?;
    private patch?;
    private release?;
    private comment?;
    static fromString(svString: string): SemVer;
    constructor(stringOrMaj: string | number, min?: number, rev?: number, patch?: number, release?: string, comment?: string);
}
export default SemVer;
