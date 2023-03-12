export declare function readBuildEnvironment(): {
    build: any;
    runtime: {
        framework: {
            nativeScript: any;
        };
        platform: {
            type: string;
            name: string;
            version: any;
            host: string;
            hostVersion: string;
            manufacturer: string;
        };
    };
    window: {
        width: number;
        height: number;
    };
};
export declare function passEnvironmentAndGetTitles(): {
    appName: string;
    title: string;
};
