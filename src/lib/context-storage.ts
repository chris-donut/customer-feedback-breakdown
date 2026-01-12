import { promises as fs } from "fs";
import path from "path";

export interface CodebaseInfo {
  name: string;
  description?: string;
  dependencies?: Record<string, string>;
  fileStructure?: string[];
  readmeContent?: string;
}

export interface ProjectContext {
  codebaseInfo?: CodebaseInfo;
  strategicPlan?: string;
  updatedAt?: string;
}

const DEFAULT_CONTEXT_FILE = "project-context.json";

function getContextFilePath(): string {
  const envPath = process.env.CONTEXT_FILE_PATH;
  if (envPath) {
    return path.isAbsolute(envPath)
      ? envPath
      : path.join(process.cwd(), envPath);
  }
  return path.join(process.cwd(), DEFAULT_CONTEXT_FILE);
}

export async function readContext(): Promise<ProjectContext> {
  const filePath = getContextFilePath();
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as ProjectContext;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function writeContext(context: ProjectContext): Promise<void> {
  const filePath = getContextFilePath();
  const updatedContext: ProjectContext = {
    ...context,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(filePath, JSON.stringify(updatedContext, null, 2), "utf-8");
}

export async function updateContext(
  updates: Partial<ProjectContext>
): Promise<ProjectContext> {
  const existing = await readContext();
  const merged: ProjectContext = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeContext(merged);
  return merged;
}

export async function updateCodebaseInfo(
  info: CodebaseInfo
): Promise<ProjectContext> {
  return updateContext({ codebaseInfo: info });
}

export async function updateStrategicPlan(
  plan: string
): Promise<ProjectContext> {
  return updateContext({ strategicPlan: plan });
}
