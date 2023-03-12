/**
 * Structure of object for a Web Request
 */
export declare class WebRequest {
    endpoint: string;
    method: string;
    headers: object;
    parameters: Parameter[];
    body?: string;
    type: string;
}
/**
 * Structure of an object for a Parameter
 */
declare class Parameter {
    name: string;
    value: string;
}
/**
 * Status types enum
 * (a direct mapping of unirest statusType values)
 */
declare enum StatusType {
    None = 0,
    Info = 1,
    Ok = 2,
    Misc = 3,
    ClientError = 4,
    ServerError = 5
}
/**
 * Structure of object for a Web Response
 */
export declare class WebResponse {
    code: number;
    statusType: StatusType;
    headers: object;
    body: string;
}
/**
 * Send a request and get the response
 * @param request
 */
export declare function webSend(request: WebRequest): Promise<WebResponse>;
export {};
