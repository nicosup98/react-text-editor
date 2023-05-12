import { useEffect, useMemo, useState } from "react";
import { open,save } from "@tauri-apps/api/dialog";
import { documentDir,basename,join, homeDir } from "@tauri-apps/api/path"
import { writeTextFile,BaseDirectory,readTextFile,readDir,createDir, FileEntry,exists } from "@tauri-apps/api/fs"
import "./App.css";
import { Editor } from "@monaco-editor/react";
import type { MapFile,FileData } from "./model/FilesModel";

function App() {
  const [cacheFiles,setCacheFiles] = useState<MapFile>({"nuevo archivo":{data:"",languaje:"txt",name:"nuevo archivo"}}) 
  const [baseDir,setBaseDir] = useState("")
  const [filesOfDir,setFilesOfDir] = useState<FileEntry[]>([])
  const [currentFile,setcurrentFile] = useState("nuevo archivo")
  const fileFocused = useMemo(()=>cacheFiles[currentFile],[currentFile,cacheFiles])

  useEffect(()=>{
    refreshDir()
  },[baseDir])

  async function saveAsFile(){
    const path = await save({defaultPath:baseDir})
    if(path == null) return
    await writeTextFile(path,fileFocused.data)
    replaceNewFile(path,fileFocused.data)

  }

  async function saveFile(){
    if(!fileFocused) return console.log("fileFocused undefine en saveFile")
    const path = !!fileFocused.path ? fileFocused.path : await save({defaultPath:baseDir})

    if(path == null) return


    await writeTextFile(path,fileFocused.data)

    refreshDir()

    replaceNewFile(path,fileFocused.data)
    
  }

  async function replaceNewFile(path: string,data: string){
    if(fileFocused.name !== "nuevo archivo" || !cacheFiles["nuevo archivo"]) return

    const name = await basename(path)

    
    setCacheFiles(cf=>({...cf,[path]:{name,data,languaje:"txt",path}}))
    setcurrentFile(path)
    
    delete cacheFiles["nuevo archivo"]
  }

  async function openFile(){
    const path = await open({directory:false,recursive:true,multiple:false}) as string
    if(path == null) return
    const name = await basename(path)
    const data = await readTextFile(path)

    // cacheFiles[path] = {name,data,languaje:"txt",path}
    setCacheFiles(cf=>({...cf,[path]:{name,data,languaje:"txt",path}}))
    setcurrentFile(path)
  }

  async function openDir(){
    const dir = await open({directory:true,multiple:false,recursive:true}) as string | null

    if(dir == null) return

    setBaseDir(dir)
    
    // const files = await readDir(dir)
    // setFilesOfDir(files)
  }
  async function refreshDir(){
    const files = await readDir(baseDir)
    setFilesOfDir(files)
  }

  async function changeFocusFile(path:string){
    console.log({path})
    if(!cacheFiles[path]){
      console.log("if")
      const data = await readTextFile(path)
      const name = await basename(path)
      // cacheFiles[path] = {name,data,languaje:"txt",path}
      setCacheFiles(cf=> ({...cf,[path]:{name,data,languaje:"txt",path}}))
    }
    setcurrentFile(path)
  }

  async function createFile(){
    // cacheFiles[await join(baseDir,"nuevo archivo.txt")] = {data:"",languaje:"txt",name:"nuevo archivo"}
    const name = await join(baseDir,"nuevo archivo.txt")
    setCacheFiles(cf=>({...cf,[name]:{data:"",languaje:"txt",name,path:name}}))
  }

  function handleData(value?: string){
    fileFocused.data = value || ""
  }
  async function onEditorMount(){
    setBaseDir(await homeDir())
  }

  function getNamesOfCacheFiles(){
    const cachedFiles = []

    for(const cf in cacheFiles){
      cachedFiles.push({path:cf,name:cacheFiles[cf].name})
    }
    return cachedFiles
  }

  return (
    <div className="app">
      <div className="flex-container">
        <div className="flex-container-row">
          <div className="flex-container documents">
            {
              (filesOfDir.map((f,i)=> <div key={i} onClick={async ()=>await changeFocusFile(f.path)}>{f.name}</div>))
            }
          </div>
          <div className="flex-container full-width">
            <div className="flex-container-row gap">
            {
              getNamesOfCacheFiles().map((cf,i)=>(
                <div key={i} onClick={async ()=>await changeFocusFile(cf.path)}> {cf.name} </div>
              ))
            }
            </div>
            <Editor defaultLanguage="plaintext" onMount={onEditorMount} path={fileFocused.name} theme="vs-ligth" width="100%" height="90vh" defaultValue={fileFocused.data} onChange={handleData}/>
          </div>
        </div>
        <div className="flex-container">
          <button onClick={saveFile}>salvar</button>
          <button onClick={saveAsFile}>salvar como</button>
          <button onClick={openDir}>abrir directorio</button>
          <button onClick={()=> console.log({cacheFiles,baseDir,fileFocused,currentFile})}>log</button>
        </div>
      </div>
    </div>
  )


}
export default App;
