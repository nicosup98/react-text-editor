import { ShortcutHandler } from "@tauri-apps/api/globalShortcut"

export interface FileData {
    name: string
    data: string
    languaje: string
    path?:string
    isSaved: boolean
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