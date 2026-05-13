interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * NuGet MCP — .NET package registry
 *
 * API docs: https://learn.microsoft.com/en-us/nuget/api/overview
 * Auth: none.
 */


const SEARCH_URL = 'https://azuresearch-usnc.nuget.org/query';
const REGISTRATION_URL = 'https://api.nuget.org/v3/registration5-semver1';
const FLAT_CONTAINER_URL = 'https://api.nuget.org/v3-flatcontainer';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description: 'Full-text search across NuGet packages.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text query' },
        prerelease: { type: 'boolean', description: 'Include prerelease packages (default false)' },
        take: { type: 'number', description: 'Max results, 1-1000 (default 20)' },
        skip: { type: 'number', description: '0-based offset' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_package',
    description: 'Registration metadata for a package — versions, tags, dependencies, dates.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Package id (e.g. "Newtonsoft.Json")' },
        prerelease: { type: 'boolean', description: 'Include prerelease pages (default false)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_versions',
    description: 'All published versions of a package.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Package id' } },
      required: ['id'],
    },
  },
  {
    name: 'latest_version',
    description: 'Most recent released version of a package.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Package id' },
        prerelease: { type: 'boolean', description: 'Allow prerelease (default false)' },
      },
      required: ['id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search': {
      const params = new URLSearchParams({
        q: String(args.query),
        prerelease: String(args.prerelease === true),
        take: String(Math.min(1000, Math.max(1, (args.take as number) ?? 20))),
        skip: String(Math.max(0, (args.skip as number) ?? 0)),
      });
      return nugetGet(`${SEARCH_URL}?${params}`);
    }
    case 'get_package': {
      const id = reqStr(args, 'id', '"Newtonsoft.Json"').toLowerCase();
      return nugetGet(`${REGISTRATION_URL}/${id}/index.json`);
    }
    case 'list_versions': {
      const id = reqStr(args, 'id', '"Newtonsoft.Json"').toLowerCase();
      return nugetGet(`${FLAT_CONTAINER_URL}/${id}/index.json`);
    }
    case 'latest_version': {
      const id = reqStr(args, 'id', '"Newtonsoft.Json"').toLowerCase();
      const data = (await nugetGet(`${FLAT_CONTAINER_URL}/${id}/index.json`)) as { versions?: string[] };
      const versions = data.versions ?? [];
      const allowPrerelease = args.prerelease === true;
      const filtered = allowPrerelease ? versions : versions.filter((v) => !v.includes('-'));
      const latest = filtered[filtered.length - 1] ?? null;
      return { id, latest_version: latest, total_versions: versions.length };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function nugetGet(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 404) throw new Error(`NuGet: not found`);
  if (res.status === 429) throw new Error('NuGet: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`NuGet error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
