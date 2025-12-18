import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Sidebar } from "@/components/layout/Sidebar";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { MOCK_FILE_TREE, FileNode } from "@/lib/mockFileTree";
import { toast } from "@/hooks/use-toast";

export default function IDE() {
  const [files] = useState<FileNode[]>(MOCK_FILE_TREE);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(MOCK_FILE_TREE[0].children![0].children![0]); // Default to main.py
  const [logs, setLogs] = useState<string[]>([]);

  const handleSelectFile = (file: FileNode) => {
    setSelectedFile(file);
  };

  const handleRun = (code: string) => {
    setLogs(prev => [...prev, `Running ${selectedFile?.name}...`]);
    
    // Simulate execution output based on content
    setTimeout(() => {
        if (code.includes("fibonacci")) {
             setLogs(prev => [...prev, "[LOG] Starting PyForge Engine...", "Fibonacci(10) = 55", "[LOG] Process complete."]);
        } else if (code.includes("print")) {
            // Extract print statements rudimentarily
            const prints = code.match(/print\((["'])(.*?)\1\)/g);
            if (prints) {
                prints.forEach(p => {
                    const content = p.match(/print\((["'])(.*?)\1\)/)?.[2];
                    if (content) setLogs(prev => [...prev, content]);
                });
            } else {
                 setLogs(prev => [...prev, "Process finished with exit code 0"]);
            }
        } else {
             setLogs(prev => [...prev, "Process finished with exit code 0"]);
        }
    }, 800);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex text-foreground">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
          <Sidebar 
            files={files} 
            selectedFileId={selectedFile?.id || null} 
            onSelectFile={handleSelectFile} 
          />
        </Panel>
        
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
        
        <Panel defaultSize={80}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={70} minSize={30}>
              <CodeEditor file={selectedFile} onRun={handleRun} />
            </Panel>
            
            <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors cursor-row-resize" />
            
            <Panel defaultSize={30} minSize={10}>
              <TerminalPanel logs={logs} onClear={handleClearLogs} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
