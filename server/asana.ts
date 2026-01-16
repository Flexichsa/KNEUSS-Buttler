// Asana Integration - Uses Replit Connector
import * as Asana from 'asana';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=asana',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Asana not connected');
  }
  return accessToken;
}

async function getAsanaApiInstances() {
  const accessToken = await getAccessToken();
  
  const client = Asana.ApiClient.instance;
  const token = client.authentications['token'];
  token.accessToken = accessToken;

  return {
    tasksApi: new Asana.TasksApi(),
    projectsApi: new Asana.ProjectsApi(),
    usersApi: new Asana.UsersApi(),
    workspacesApi: new Asana.WorkspacesApi()
  };
}

export async function isAsanaConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export async function getAsanaUser(): Promise<any> {
  const { usersApi } = await getAsanaApiInstances();
  const result = await usersApi.getUser('me', {});
  return result.data;
}

export async function getWorkspaces(): Promise<any[]> {
  const { workspacesApi } = await getAsanaApiInstances();
  const result = await workspacesApi.getWorkspaces({});
  return result.data || [];
}

export async function getProjects(workspaceGid?: string): Promise<any[]> {
  const { projectsApi, workspacesApi } = await getAsanaApiInstances();
  
  let wsGid = workspaceGid;
  if (!wsGid) {
    const workspaces = await workspacesApi.getWorkspaces({});
    if (workspaces.data && workspaces.data.length > 0) {
      wsGid = workspaces.data[0].gid;
    }
  }
  
  if (!wsGid) {
    return [];
  }
  
  const result = await projectsApi.getProjectsForWorkspace(wsGid, {
    opt_fields: 'name,color,archived,notes,due_date,due_on'
  });
  
  return (result.data || []).filter((p: any) => !p.archived);
}

export async function getTasksForProject(projectGid: string): Promise<any[]> {
  const { tasksApi } = await getAsanaApiInstances();
  
  const result = await tasksApi.getTasksForProject(projectGid, {
    opt_fields: 'name,completed,due_on,due_at,assignee,assignee.name,notes,tags,created_at,modified_at'
  });
  
  return result.data || [];
}

export async function getMyTasks(workspaceGid?: string): Promise<any[]> {
  const { tasksApi, usersApi, workspacesApi } = await getAsanaApiInstances();
  
  let wsGid = workspaceGid;
  if (!wsGid) {
    const workspaces = await workspacesApi.getWorkspaces({});
    if (workspaces.data && workspaces.data.length > 0) {
      wsGid = workspaces.data[0].gid;
    }
  }
  
  if (!wsGid) {
    return [];
  }
  
  const userResult = await usersApi.getUser('me', {});
  const userGid = userResult.data.gid;
  
  const result = await tasksApi.getTasksForUserTaskList(`${userGid}`, {
    opt_fields: 'name,completed,due_on,due_at,assignee,assignee.name,notes,projects,projects.name,created_at,modified_at'
  });
  
  return (result.data || []).filter((t: any) => !t.completed);
}

export async function getAllTasks(workspaceGid?: string, includeCompleted: boolean = false): Promise<any[]> {
  const projects = await getProjects(workspaceGid);
  
  const allTasks: any[] = [];
  
  for (const project of projects.slice(0, 5)) {
    try {
      const tasks = await getTasksForProject(project.gid);
      const tasksWithProject = tasks.map(t => ({
        ...t,
        project: { gid: project.gid, name: project.name, color: (project as any).color }
      }));
      
      if (includeCompleted) {
        allTasks.push(...tasksWithProject);
      } else {
        allTasks.push(...tasksWithProject.filter((t: any) => !t.completed));
      }
    } catch (e) {
      console.error(`Failed to fetch tasks for project ${project.name}:`, e);
    }
  }
  
  return allTasks.sort((a, b) => {
    if (!a.due_on && !b.due_on) return 0;
    if (!a.due_on) return 1;
    if (!b.due_on) return -1;
    return new Date(a.due_on).getTime() - new Date(b.due_on).getTime();
  });
}
