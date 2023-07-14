import { useEffect, useState } from "react";
import type { CompilerResponse, FileData } from "../model/FilesModel";


function Compiler({fileFocused, shouldCompile}: {fileFocused: FileData, shouldCompile: boolean}){
    const [wordsCount,setWordsCount] = useState<CompilerResponse>({})

    function totalWords(words:string){
        let lettersCount: CompilerResponse = {}
        for(let v of words.replace(/\s/g,'')){
            lettersCount[v] = !!lettersCount[v]? lettersCount[v] +1 : 1
        }
        return lettersCount
    }

    useEffect(()=>{
        shouldCompile && setWordsCount(totalWords(fileFocused.data))
    },[shouldCompile])
    return(
    <>
    {JSON.stringify(wordsCount)}
    </>
    )
}

export default Compiler