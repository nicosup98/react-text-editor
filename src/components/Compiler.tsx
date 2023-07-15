import { useEffect, useMemo, useState } from "react";
import type { CompilerResponse, FileData } from "../model/FilesModel";
import { save } from "@tauri-apps/api/dialog"
import { useRecoilValue } from "recoil";
import { currentDir } from "../atoms"
import { writeTextFile } from "@tauri-apps/api/fs";
import { sendNotification } from "@tauri-apps/api/notification"

function Compiler({
  fileFocused,
  shouldCompile,
  refreshDir
}: {
  fileFocused: FileData;
  shouldCompile: boolean;
  refreshDir: ()=> void
}) {
  const [wordsCount, setWordsCount] = useState<[string, number][]>([]);
  const baseDir = useRecoilValue(currentDir)

  const wordsMin = useMemo(
    () => fileFocused.data.replace(/\s/g, ""),
    [fileFocused]
  );

  function totalWords(words: string) {
    let lettersCount: CompilerResponse = {};
    for (let v of wordsMin) {
      lettersCount[v] = !!lettersCount[v] ? lettersCount[v] + 1 : 1;
    }
    return Object.entries(lettersCount);
  }

  async function exportCompilation(target: string){
    const path = await save({defaultPath:baseDir,filters:[{name:"texto",extensions:["txt"]}]})

    if(!path) return

    await writeTextFile(path,target)
    sendNotification(`compilacion guardada en ${path} con exito`)
    refreshDir()
  }

  useEffect(() => {
    shouldCompile && setWordsCount(totalWords(fileFocused.data));
  }, [shouldCompile]);

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="is-flex ">
        {wordsCount.map((v) => (
          <div className="m-1">{`${v[0]}:${v[1]}`}</div>
        ))}
      </div>
      <div className="block m-1">
        <div className="is-flex is-justify-content-center">resultado</div>
        <div className="is-flex is-align-items-stretch">{wordsMin}</div>
      </div>
      <div className="is-flex is-justify-content-end m-1">
        <button className="button" onClick={()=>exportCompilation(wordsMin)}>exportar</button>
      </div>
    </div>
  );
}

export default Compiler;
