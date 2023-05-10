export interface FileData {
    name: string
    data: string
    languaje: string
    path?:string
}

export interface MapFile {
    [key : string] : FileData
}