import { useState, useEffect, useCallback } from "react";
import { ToggleButton, ToggleOption } from "../toggleButtons";

const lms: ToggleOption[] = [
    {key: "gpt2", label: "GPT2", blocked: false},
    {key: "llama3", label: "Llama3", blocked: false}
]



export const LMFunctionCombinedSwitch = () => {
    const [selectedLM, setSelectedLM]= useState<string>("gpt2");
    const [selectedFunction, setSelectedFunction] = useState<string>("completion");

    const [functions, setFunctions] = useState<ToggleOption[]>([{key: "completion", label: "Text Completion", blocked: false}, {key: "query", label: "Query Response", blocked: true}])

    // Modify available functions depending on selected LM
    useEffect(() => {
        console.log(selectedFunction, selectedLM)
        if (selectedLM == "gpt2") {
            setFunctions([{key: "completion", label: "Text Completion", blocked: false}, {key: "query", label: "Query Response", blocked: true}]);
            setSelectedFunction("completion");

        }
        else if (selectedLM == "llama3") {
            setFunctions([{key: "completion", label: "Text Completion", blocked: true}, {key: "query", label: "Query Response", blocked: false}]);
            setSelectedFunction("query");
        }
    }, [selectedLM]);

    // Handle Selecting any available value
    const handleFunctionSelection = useCallback((func: string) => {
        setSelectedFunction(func);
    }, [])

    // Handle Selecting an LM
    const handleLMSelection = useCallback((lm: string) => {
        setSelectedLM(lm)
    }, [])


    return <>
    <ToggleButton options={lms} onChange={handleLMSelection} value={selectedLM}></ToggleButton>
    <ToggleButton options={functions} onChange={handleFunctionSelection} value={selectedFunction}></ToggleButton>
    </>
}