import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus, Search, MoreVertical } from "lucide-react";
import { FileNode, getIconForFile } from "@/lib/mockFileTree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoUrl from "@assets/generated_images/abstract_python_cybernetic_logo.png";

interface SidebarProps {
  files: FileNode[];
  selectedFileId: string | null;
  onSelectFile: (file: FileNode) => void;
}

const FileTreeItem = ({ 
  node, 
  depth = 0, 
  selectedFileId, 
  onSelectFile 
}: { 
  node: FileNode; 
  depth?: number; 
  selectedFileId: string | null;
  onSelectFile: (file: FileNode) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const Icon = getIconForFile(node.name, node.type, isOpen);
  const isSelected = selectedFileId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 cursor-pointer text-sm select-none transition-colors",
          isSelected ? "bg-primary/20 text-primary border-r-2 border-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <span className="mr-1.5 opacity-70">
          {node.type === "folder" && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
          {node.type === "file" && <span className="w-[14px] inline-block" />}
        </span>
        <Icon size={16} className={cn("mr-2", node.name.endsWith("py") ? "text-secondary" : "")} />
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "folder" && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem 
              key={child.id} 
              node={child} 
              depth={depth + 1} 
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function Sidebar({ files, selectedFileId, onSelectFile }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
                <img src={logoUrl} alt="PyForge" className="w-full h-full object-cover opacity-80" />
            </div>
            <span className="font-mono font-bold tracking-tight text-lg">PyForge</span>
        </div>
        <div className="flex gap-1 mb-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Plus size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Search size={16} />
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <MoreVertical size={16} />
            </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 py-2">
        <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explorer</div>
        {files.map((node) => (
          <FileTreeItem 
            key={node.id} 
            node={node} 
            selectedFileId={selectedFileId}
            onSelectFile={onSelectFile}
          />
        ))}
      </ScrollArea>
      
      <div className="p-2 border-t border-sidebar-border text-xs text-muted-foreground flex justify-between px-4">
        <span>PyForge v0.9.1-alpha</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected</span>
      </div>
    </div>
  );
}
