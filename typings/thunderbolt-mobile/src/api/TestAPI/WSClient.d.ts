export declare type ClientEventHandler = (data: any) => void;
export declare class WSClient {
    ws: any;
    eventMap: any;
    connect(serviceUrl: string): Promise<unknown>;
    send(data: any): void;
    end(code?: number): void;
    on(event: string, handler: ClientEventHandler): void;
    handleEvent(event: string, data: any): void;
}
export declare function connectClient(service: string): Promise<WSClient>;
export declare function clientTest(service: string): Promise<number>;
