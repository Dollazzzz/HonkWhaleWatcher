import { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-json";
import { cn } from "@/lib/utils";
import { FileNode } from "@/lib/mockFileTree";
import { Play, Save, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  file: FileNode | null;
  onRun?: (code: string) => void;
}

export function CodeEditor({ file, onRun }: CodeEditorProps) {
  const [code, setCode] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file && file.content) {
      setCode(file.content);
      setIsSaved(true);
    } else {
        setCode("");
    }
  }, [file]);

  const handleChange = (newCode: string) => {
    setCode(newCode);
    setIsSaved(false);
  };
  
  const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  if (!file) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background text-muted-foreground flex-col gap-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <span className="text-4xl">⌘</span>
        </div>
        <p>Select a file to start editing</p>
      </div>
    );
  }

  const language = file.name.endsWith(".py") 
    ? languages.python 
    : file.name.endsWith(".md") 
    ? languages.markdown
    : file.name.endsWith(".json")
    ? languages.json
    : undefined;

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">{file.name}</span>
            {!isSaved && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsSaved(true)} className="h-8 w-8 p-0">
                <Save size={14} />
            </Button>
            {file.name.endsWith(".py") && (
                <Button 
                    size="sm" 
                    className="h-8 gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_20px_rgba(22,163,74,0.5)] transition-all"
                    onClick={() => onRun?.(code)}
                >
                    <Play size={14} fill="currentColor" /> Run
                </Button>
            )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar relative font-mono text-sm leading-relaxed" style={{ backgroundColor: 'var(--color-background)' }}>
        <Editor
          value={code}
          onValueChange={handleChange}
          highlight={(code) => language ? highlight(code, language, file.name.split('.').pop() || 'text') : code}
          padding={24}
          className="min-h-full"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            backgroundColor: 'transparent',
            minHeight: '100%',
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
    </div>
  );
}
