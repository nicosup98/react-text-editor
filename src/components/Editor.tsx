import { useEffect, useMemo, useState } from "react";
import { open, save } from "@tauri-apps/api/dialog";
import { basename, homeDir } from "@tauri-apps/api/path";
import {
  writeTextFile,
  readTextFile,
  readDir,
  FileEntry,
} from "@tauri-apps/api/fs";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import type { FileData, MapFile, ShorcutCommands } from "../model/FilesModel";
import { registerAll, unregisterAll } from "@tauri-apps/api/globalShortcut";
import { nanoid } from "nanoid";
import { useRecoilState } from "recoil";
import { cachefiles, currentDir } from "../atoms";
import Compiler from "./Compiler";

function Editor() {
  const [cacheFiles, setCacheFiles] = useRecoilState(cachefiles);
  const [baseDir, setBaseDir] = useRecoilState(currentDir);
  const [filesOfDir, setFilesOfDir] = useState<FileEntry[]>([]);
  const [currentFile, setcurrentFile] = useState("");
  const [shouldCompile, setShouldCompile] = useState(false);

  const fileFocused = useMemo(
    () => cacheFiles[currentFile],
    [currentFile, cacheFiles]
  );
  const namesOfCacheFile = useMemo(()=> getNamesOfCacheFiles(cacheFiles),[cacheFiles])

  useEffect(()=>{
    homeDir().then(dir=>setBaseDir(dir))
    initCommands();
  },[])

  useEffect(() => {
    refreshDir();
    initCommands();
  }, [baseDir]);

  useEffect(() => {
    initCommands();
    setShouldCompile(false);
  }, [fileFocused]);




//para que funcione bien hay que pasar el estado a rust
  async function initCommands() {
    await unregisterAll();
    const shortCuts: ShorcutCommands = {
      "CommandOrControl+n": generatesNewFile,
      "CommandOrControl+o": openFile,
      "CommandOrControl+Shift+O": openDir,
      "CommandOrControl+s": saveFile,
    };
    registerAll(
      [
        "CommandOrControl+n",
        "CommandOrControl+o",
        "CommandOrControl+Shift+O",
        "CommandOrControl+s",
      ],
      (commands) => {
        shortCuts[commands]();
      }
    );
  }

  function generatesNewFile(): void {
    const fileName = nanoid(8);
    console.log({ fileName });
    if (!!cacheFiles[fileName]) {
      console.log("itero");
      return generatesNewFile();
    }
    setCacheFiles((f) => ({
      ...f,
      [fileName]: { data: "", languaje: "txt", name: fileName },
    }));
    setcurrentFile(fileName);
    return;
  }

  async function saveAsFile() {
    const path = await save({ defaultPath: baseDir, filters:[{extensions:["txt"],name:"texto plano"}] });
    if (path == null) return;
    await writeTextFile(path, fileFocused.data);
    replaceNewFile(path, fileFocused.data);
    refreshDir();
  }

  async function saveFile() {
    if (!fileFocused) return console.log("fileFocused undefine en saveFile");
    const path = !!fileFocused.path
      ? fileFocused.path
      : await save({ defaultPath: baseDir,filters:[{extensions:["txt"],name:"texto plano"}] });

    if (path == null) return;

    await writeTextFile(path, fileFocused.data);

    await replaceNewFile(path, fileFocused.data);
    refreshDir();
  }

  async function replaceNewFile(path: string, data: string) {
    if (!!fileFocused.path) return;
    const oldFile = fileFocused.name;
    const name = await basename(path);

    setCacheFiles((cf) => {
      let newCache: MapFile = {};
      for (const f in cf) {
        if (f === oldFile) continue;
        newCache[f] = cf[f];
      }
      newCache[path] = { name, data, languaje: "txt", path };
      return newCache;
    });
    setcurrentFile(path);
  }

  async function openFile() {
    const path = (await open({
      directory: false,
      recursive: true,
      multiple: false,
    })) as string;
    if (path == null) return;
    const name = await basename(path);
    const data = await readTextFile(path);

    // cacheFiles[path] = {name,data,languaje:"txt",path}
    setCacheFiles((cf) => ({
      ...cf,
      [path]: { name, data, languaje: "txt", path },
    }));
    setcurrentFile(path);
  }

  async function openDir() {
    const dir = (await open({
      directory: true,
      multiple: false,
      recursive: true,
    })) as string | null;

    if (dir == null) return;

    setBaseDir(dir);

    // const files = await readDir(dir)
    // setFilesOfDir(files)
  }
  async function refreshDir() {
    console.log({ baseDir });
    const files = await readDir(baseDir);
    setFilesOfDir(files.filter(f=> !f.children));
  }

  async function changeFocusFile(path: string) {
    console.log({ path });
    if (!cacheFiles[path]) {
      console.log("if");
      const data = await readTextFile(path);
      const name = await basename(path);
      // cacheFiles[path] = {name,data,languaje:"txt",path}
      setCacheFiles((cf) => ({
        ...cf,
        [path]: { name, data, languaje: "txt", path },
      }));
    }
    setcurrentFile(path);
  }

  function closeFile() {
    const oldFile = (fileFocused.path || fileFocused.name).slice();
    const keys = Object.keys(cacheFiles).filter((k) => k !== oldFile);
    console.log({keys,oldFile})
    if (keys.length === 0) {
      setcurrentFile("")
      setCacheFiles({})
      return
    }
    const randomNum = Math.floor(Math.random() * keys.length);
    console.log(keys[randomNum]);
    setcurrentFile(keys[randomNum]);
    setCacheFiles((cf) => {
      const newCache: MapFile = {};
      for (const e in cf) {
        if (e === oldFile) continue;
        newCache[e] = cf[e];
      }
      return newCache;
    });
  }

  // async function createFile(){

  //   const name = await join(baseDir,"archivo.txt")
  //   setCacheFiles(cf=>({...cf,[name]:{data:"",languaje:"txt",name,path:name}}))
  // }

  function handleData(value?: string) {
    // fileFocused.data = value || ""
    let ff = { ...fileFocused, data: value || "" };

    setCacheFiles((cf) => ({ ...cf, [currentFile]: ff }));
  }

  function getNamesOfCacheFiles(cacheFiles: MapFile) {
    const cachedFiles = [];
    if (!cacheFiles) return []
    for (const cf in cacheFiles) {
      cachedFiles.push({ path: cf, name: cacheFiles[cf].name });
    }
    return cachedFiles;
  }

  function comparePathOrName(cf:{path:string,name:string},_fileFocused: FileData){
    console.log({cf,_fileFocused})
    if (!_fileFocused) return false
    if(!!_fileFocused?.path){
      return _fileFocused.path === cf.path
    }
    return _fileFocused.name === cf.name
  }

  return (
    <div className="container is-widescreen">
      <div className="container is-clearfix">
        {!!fileFocused && (
          <>
            <button className="button m-1" onClick={saveFile}>
              salvar
            </button>
            <button className="button m-1" onClick={saveAsFile}>
              salvar como
            </button>
            <button className="button m-1" onClick={closeFile}>
              cerrar pestaña
            </button>
            <button
              className="button m-1"
              onClick={() => {
                setShouldCompile(true);
              }}
            >
              compilar
            </button>
          </>
        )}
        <button className="button m-1" onClick={openDir}>
          abrir directorio
        </button>
        {shouldCompile && (
          <div className="border">
            <Compiler fileFocused={fileFocused} shouldCompile={shouldCompile} refreshDir={refreshDir} />
            <hr/>
          </div>
        )}
      </div>
      <div className="columns">
        <div className="column is-one-quarter">
          <div className="is-flex-direction-column">
            {filesOfDir.map((f, i) => (
              <div
                className="is-clickable"
                key={i}
                onClick={async () => await changeFocusFile(f.path)}
              >
                {f.name}
              </div>
            ))}
          </div>
        </div>
        <div className="column">
          <div className="is-flex is-flex-direction-row">
            {namesOfCacheFile.map((cf, i) => (
              <div
                className="p-1 is-clickable"
                key={i}
                onClick={async () => await changeFocusFile(cf.path)}
              >
                {" "}
                {cf.name}
                {fileFocused?.path === cf.path || fileFocused?.name === cf.name ? " *" : ""}
              </div>
            ))}
          </div>
          {!!fileFocused && (
            <MonacoEditor
              defaultLanguage="plaintext"
              path={fileFocused.name}
              theme="vs-ligth"
              width="100%"
              height="90vh"
              defaultValue={fileFocused.data}
              onChange={handleData}
            />
          )}
        </div>
      </div>
      
    </div>
  );
}
export default Editor;
