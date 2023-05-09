import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import { documentDir,basename,join } from "@tauri-apps/api/path"
import { writeTextFile,BaseDirectory,readTextFile,readDir,createDir, FileEntry,exists } from "@tauri-apps/api/fs"
import "./App.css";
import { Editor } from "@monaco-editor/react";
import { FileData } from "./model/FileData";

function App() {
  const [curentPath,setCurrentPath] = useState("")
  const [currentDir,setCurrentDir] = useState<FileEntry[]>([])
  const files = new Map<string,FileData>()
  const [currentFile,setCurrentFile] = useState("")
  let focusFile = useMemo(()=>files.get(currentFile),[currentFile])
  useEffect(()=>{
    async function init(){
      if(!(await exists("compiladores",{dir:BaseDirectory.Document}))){
        await createDir("compiladores",{dir:BaseDirectory.Document})
      }
      const dir = await readDir("compiladores",{dir:BaseDirectory.Document})
      setCurrentDir(dir)
      setCurrentPath(await join(await documentDir(),"compiladores"))
    }
    init().catch(err=> console.log(err))
  },[])

  const openDir = async ()=>{
    const path = await open({multiple:false,recursive:true,defaultPath:await documentDir()}) as string
    const files = await readDir(path)
    setCurrentPath(path)
    setCurrentDir(files)
  }

  const openFile = async ()=> {
    const path = await open({multiple:false,recursive:true,defaultPath:await documentDir()}) as string
    const data = await readTextFile(path)
    const name = await basename(path)
    if(path != null) files.set(path,{name,data,languaje:"txt"})
  }

  const createFile = async ()=> {
    files.set(await join(curentPath,currentFile),{name:currentFile,data:"",languaje:"txt"})
  }
  const saveFile = async ()=> {
    await writeTextFile(await join(curentPath,currentFile),focusFile?.data || "no hay data")
  }

  const saveAsFile = async ()=> {
    const path = await open({multiple:false,defaultPath:curentPath,recursive:true,title:"nuevo archivo"}) as string
    await writeTextFile(path,focusFile?.data || "no hay data")
  }

  const changeFocusFile = (path: string)=>{
    setCurrentFile(path)
  }

  return (
    <div className="app">
      <Editor width="50%" height="95vh" theme="vs-light"path={focusFile?.name} defaultLanguage={focusFile?.languaje} defaultValue={focusFile?.data}/>
      <div className="flex justify-center">
        <button onClick={createFile}>crear</button>
        <button onClick={saveFile}>save</button>
        <button onClick={saveAsFile}>save as</button>
      </div>
      <div className="flex justify-center p-1">
        {
          currentDir.map(d=><div onClick={()=> changeFocusFile(d.path)}>{d.name}</div>)
        }
      </div>
    </div>
  )
}

export default App;
