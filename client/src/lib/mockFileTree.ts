import { FileCode, Folder, FolderOpen, FileJson, FileType, FileText, Image } from "lucide-react";

export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
};

export const MOCK_FILE_TREE: FileNode[] = [
  {
    id: "root",
    name: "pyforge-project",
    type: "folder",
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        children: [
          {
            id: "main.py",
            name: "main.py",
            type: "file",
            language: "python",
            content: `import time
from utils import logger, calculator

def main():
    logger.log("Starting PyForge Engine...")
    
    # Simulate complex calculation
    result = calculator.fibonacci(10)
    print(f"Fibonacci(10) = {result}")
    
    logger.log("Process complete.")

if __name__ == "__main__":
    main()
`
          },
          {
            id: "utils.py",
            name: "utils.py",
            type: "file",
            language: "python",
            content: `class Logger:
    def log(self, message):
        print(f"[LOG] {message}")

class Calculator:
    def fibonacci(self, n):
        if n <= 1:
            return n
        return self.fibonacci(n-1) + self.fibonacci(n-2)

logger = Logger()
calculator = Calculator()
`
          }
        ]
      },
      {
        id: "tests",
        name: "tests",
        type: "folder",
        children: [
          {
            id: "test_main.py",
            name: "test_main.py",
            type: "file",
            language: "python",
            content: `import unittest
from src.utils import calculator

class TestCalculator(unittest.TestCase):
    def test_fib(self):
        self.assertEqual(calculator.fibonacci(10), 55)

if __name__ == '__main__':
    unittest.main()
`
          }
        ]
      },
      {
        id: "requirements.txt",
        name: "requirements.txt",
        type: "file",
        language: "text",
        content: `numpy>=1.21.0
pandas>=1.3.0
requests>=2.26.0
flask>=2.0.1
`
      },
      {
        id: "README.md",
        name: "README.md",
        type: "file",
        language: "markdown",
        content: `# PyForge Project

This is a sample Python project created with PyForge IDE.

## Features
- Real-time syntax highlighting
- Intelligent code completion (mockup)
- Integrated terminal
`
      }
    ]
  }
];

export const getIconForFile = (name: string, type: "file" | "folder", isOpen?: boolean) => {
  if (type === "folder") {
    return isOpen ? FolderOpen : Folder;
  }
  if (name.endsWith(".py")) return FileCode;
  if (name.endsWith(".json")) return FileJson;
  if (name.endsWith(".md")) return FileText;
  if (name.endsWith(".png") || name.endsWith(".jpg")) return Image;
  return FileType;
};
