import { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  logs: string[];
  onClear: () => void;
}

export function TerminalPanel({ logs, onClear }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-sidebar border-t border-sidebar-border font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-sidebar-border bg-sidebar-accent/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TerminalIcon size={14} />
          <span className="text-xs font-semibold tracking-wide uppercase">Console Output</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors" onClick={onClear}>
            <Trash2 size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Maximize2 size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <X size={12} />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 space-y-1 font-mono text-xs md:text-sm"
      >
        <div className="text-muted-foreground/50 italic mb-2">PyForge v0.9.1-alpha environment ready...</div>
        {logs.map((log, index) => (
          <div key={index} className="break-all whitespace-pre-wrap animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-green-500 mr-2">➜</span>
            <span className="text-foreground/90">{log}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 text-primary animate-pulse">
            <span className="text-green-500">➜</span>
            <span className="w-2 h-4 bg-primary/50 block" />
        </div>
      </div>
    </div>
  );
}
