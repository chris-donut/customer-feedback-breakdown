import { LinearClient, Issue, Team, User } from "@linear/sdk";

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  console.warn("LINEAR_API_KEY not set - Linear integration will not work");
}

export const linearClient = apiKey ? new LinearClient({ apiKey }) : null;

export interface CreateIssueInput {
  title: string;
  description?: string;
  teamId?: string;
  labelIds?: string[];
}

export interface CreateIssueResult {
  success: boolean;
  issue?: Issue;
  url?: string;
  error?: string;
}

export async function createIssue(
  input: CreateIssueInput
): Promise<CreateIssueResult> {
  if (!linearClient) {
    return { success: false, error: "LINEAR_API_KEY not configured" };
  }

  const teamId = input.teamId ?? process.env.LINEAR_TEAM_ID;
  if (!teamId) {
    return { success: false, error: "No team ID provided or LINEAR_TEAM_ID not set" };
  }

  try {
    const issuePayload = await linearClient.createIssue({
      title: input.title,
      description: input.description,
      teamId,
      labelIds: input.labelIds,
    });

    const issue = await issuePayload.issue;
    if (!issue) {
      return { success: false, error: "Issue creation returned no issue" };
    }

    return {
      success: true,
      issue,
      url: issue.url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface TeamInfo {
  id: string;
  name: string;
  key: string;
}

export async function listTeams(): Promise<TeamInfo[]> {
  if (!linearClient) {
    return [];
  }

  try {
    const teamsConnection = await linearClient.teams();
    const teams: TeamInfo[] = [];

    for (const team of teamsConnection.nodes) {
      teams.push({
        id: team.id,
        name: team.name,
        key: team.key,
      });
    }

    return teams;
  } catch {
    return [];
  }
}

export interface LabelInfo {
  id: string;
  name: string;
  color: string;
}

export async function listLabels(teamId?: string): Promise<LabelInfo[]> {
  if (!linearClient) {
    return [];
  }

  try {
    const labelsConnection = await linearClient.issueLabels({
      filter: teamId ? { team: { id: { eq: teamId } } } : undefined,
    });

    const labels: LabelInfo[] = [];

    for (const label of labelsConnection.nodes) {
      labels.push({
        id: label.id,
        name: label.name,
        color: label.color,
      });
    }

    return labels;
  } catch {
    return [];
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (!linearClient) {
    return null;
  }

  try {
    return await linearClient.viewer;
  } catch {
    return null;
  }
}
