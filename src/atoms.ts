import { atom, selector } from "recoil"
import { MapFile } from "./model/FilesModel"

export const cachefiles = atom<MapFile>({
    key:"cachefiles",
    default: {"archivo-1":{data:"",languaje:"txt",name:"archivo-1",isSaved:true}}
})

export const currentDir = atom({
    key:"currentDir",
    default:""
})

// export const currentFileAtom = atom({
//     key:"currentFile",
//     default:"archivo-1"
// })

// export const fileFocused = selector({
//     key:"fileFocused",
//     get: ({get})=>{
//         const currentFile =get(currentFileAtom)
//         const cache = get(cachefiles)

//         return cache[currentFile]
//     }
// })