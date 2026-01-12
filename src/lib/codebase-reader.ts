import * as fs from "fs/promises";
import * as path from "path";

/**
 * Folders to ignore when scanning the codebase
 */
const IGNORED_FOLDERS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".turbo",
  ".cache",
  "coverage",
  ".nyc_output",
  "__pycache__",
  ".pytest_cache",
  "target",
  "vendor",
]);

/**
 * Structure representing a file or directory in the codebase
 */
export interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

/**
 * Parsed package.json dependencies
 */
export interface DependencyInfo {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/**
 * Summary of a codebase
 */
export interface CodebaseSummary {
  rootPath: string;
  fileStructure: FileNode;
  dependencies: DependencyInfo | null;
  readmeContent: string | null;
}

/**
 * Recursively builds the file structure tree, ignoring specified folders
 */
async function buildFileTree(
  dirPath: string,
  maxDepth: number = 5,
  currentDepth: number = 0
): Promise<FileNode> {
  const name = path.basename(dirPath);
  const node: FileNode = { name, type: "directory", children: [] };

  if (currentDepth >= maxDepth) {
    return node;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORED_FOLDERS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const childNode = await buildFileTree(
          fullPath,
          maxDepth,
          currentDepth + 1
        );
        node.children!.push(childNode);
      } else if (entry.isFile()) {
        node.children!.push({ name: entry.name, type: "file" });
      }
    }

    // Sort children: directories first, then files, alphabetically
    node.children!.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch {
    // Directory might not be readable, return empty children
  }

  return node;
}

/**
 * Reads and parses package.json from the given directory
 */
async function readPackageJson(
  dirPath: string
): Promise<DependencyInfo | null> {
  const packageJsonPath = path.join(dirPath, "package.json");

  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content);

    return {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Reads README content from the given directory
 * Checks for common README filenames
 */
async function readReadme(dirPath: string): Promise<string | null> {
  const readmeNames = [
    "README.md",
    "readme.md",
    "README.MD",
    "README",
    "readme",
    "README.txt",
    "readme.txt",
  ];

  for (const name of readmeNames) {
    const readmePath = path.join(dirPath, name);
    try {
      const content = await fs.readFile(readmePath, "utf-8");
      return content;
    } catch {
      // Try next filename
    }
  }

  return null;
}

/**
 * Reads and extracts key information from a project codebase
 * @param directoryPath - Path to the project root directory
 * @returns Structured object with codebase summary
 */
export async function readCodebase(
  directoryPath: string
): Promise<CodebaseSummary> {
  const absolutePath = path.resolve(directoryPath);

  const [fileStructure, dependencies, readmeContent] = await Promise.all([
    buildFileTree(absolutePath),
    readPackageJson(absolutePath),
    readReadme(absolutePath),
  ]);

  return {
    rootPath: absolutePath,
    fileStructure,
    dependencies,
    readmeContent,
  };
}
