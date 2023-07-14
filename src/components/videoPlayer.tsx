import { useEffect, useMemo, useState } from "react";
import { open, save } from "@tauri-apps/api/dialog";
import { basename, homeDir } from "@tauri-apps/api/path";
import {
  writeTextFile,
  readTextFile,
  readDir,
  FileEntry,
} from "@tauri-apps/api/fs";
import { Editor } from "@monaco-editor/react";
import type { MapFile, ShorcutCommands } from "../model/FilesModel";
import { registerAll, unregisterAll } from "@tauri-apps/api/globalShortcut";
import { nanoid } from "nanoid";
import { useRecoilState } from "recoil";
import { cachefiles, currentDir } from "../atoms";
import Compiler from "./Compiler";

function VideoPlayer() {
  const [cacheFiles, setCacheFiles] = useRecoilState(cachefiles);
  const [baseDir, setBaseDir] = useRecoilState(currentDir);
  const [filesOfDir, setFilesOfDir] = useState<FileEntry[]>([]);
  const [currentFile, setcurrentFile] = useState("archivo-1");
  const [shouldCompile,setShouldCompile] = useState(false)
  const fileFocused = useMemo(
    () => cacheFiles[currentFile],
    [currentFile, cacheFiles]
  );

  useEffect(() => {
    refreshDir();
    initCommands();
  }, [baseDir]);

  useEffect(() => {
    initCommands();
    setShouldCompile(false)
  }, [fileFocused]);

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
      [fileName]: { data: "", languaje: "txt", name: fileName, isSaved: true },
    }));
    setcurrentFile(fileName);
    return;
  }

  async function saveAsFile() {
    const path = await save({ defaultPath: baseDir });
    if (path == null) return;
    await writeTextFile(path, fileFocused.data);
    replaceNewFile(path, fileFocused.data);
    refreshDir();
  }

  async function saveFile() {
    if (!fileFocused) return console.log("fileFocused undefine en saveFile");
    const path = !!fileFocused.path
      ? fileFocused.path
      : await save({ defaultPath: baseDir });

    if (path == null) return;

    await writeTextFile(path, fileFocused.data);

    if (!fileFocused.isSaved) fileFocused.isSaved = true;

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
      newCache[path] = { name, data, languaje: "txt", path, isSaved: true };
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
      [path]: { name, data, languaje: "txt", path, isSaved: true },
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
    setFilesOfDir(files);
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
        [path]: { name, data, languaje: "txt", path, isSaved: true },
      }));
    }
    setcurrentFile(path);
  }

  // async function createFile(){

  //   const name = await join(baseDir,"archivo.txt")
  //   setCacheFiles(cf=>({...cf,[name]:{data:"",languaje:"txt",name,path:name}}))
  // }

  function handleData(value?: string) {
    // fileFocused.data = value || ""
    // fileFocused.isSaved = false
    let ff = { ...fileFocused, data:value || "" };

    setCacheFiles((cf) => ({ ...cf, [currentFile]: ff }));
  }
  async function onEditorMount() {
    setBaseDir(await homeDir());
    initCommands();
  }

  function getNamesOfCacheFiles() {
    const cachedFiles = [];

    for (const cf in cacheFiles) {
      cachedFiles.push({ path: cf, name: cacheFiles[cf].name });
    }
    return cachedFiles;
  }

  return (
    <div className="container">
      <div className="columns">
        <div className="column is-one-quarter">
          <div className="is-flex-direction-column">
            {filesOfDir.map((f, i) => (
              <div className="is-clickable" key={i} onClick={async () => await changeFocusFile(f.path)}>
                {f.name}
                {fileFocused.isSaved ? "" : " *"}
              </div>
            ))}
          </div>
        </div>
        <div className="column">
          <div className="is-flex is-flex-direction-row">
            {getNamesOfCacheFiles().map((cf, i) => (
              <div className="p-1 is-clickable" key={i} onClick={async () => await changeFocusFile(cf.path)}>
                {" "}
                {cf.name}{" "}
              </div>
            ))}
          </div>
          <Editor
            defaultLanguage="plaintext"
            onMount={onEditorMount}
            path={fileFocused.name}
            theme="vs-ligth"
            width="100%"
            height="90vh"
            defaultValue={fileFocused.data}
            onChange={handleData}
          />
        </div>
      </div>
      <div className="container is-clearfix">
        <button className="button m-1" onClick={saveFile}>
          salvar
        </button>
        <button className="button m-1" onClick={saveAsFile}>
          salvar como
        </button>
        <button className="button m-1" onClick={openDir}>
          abrir directorio
        </button>
        <button className="button m-1" onClick={()=>{setShouldCompile(true)}}>compilar</button>
        {shouldCompile && <Compiler fileFocused={fileFocused} shouldCompile={shouldCompile} />}
        
        {/* <button
          className="button m-1"
          onClick={() =>
            console.log({ cacheFiles, baseDir, fileFocused, currentFile })
          }
        >
          log
        </button> */}
      </div>
    </div>
  );
}
export default VideoPlayer;
