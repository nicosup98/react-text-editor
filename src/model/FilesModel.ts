
export interface FileData {
    name: string
    data: string
    languaje: string
    path?:string
}

export interface MapFile {
    [key : string] : FileData
}

export interface ShorcutCommands {
    [key: string] :  ()=> Promise<void> | void
}

export interface CompilerResponse {
    [key : string] : number
}