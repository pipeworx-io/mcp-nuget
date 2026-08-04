# @pipeworx/nuget

NuGet MCP — .NET package registry. No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search(query, prerelease?, take?, skip?)`
- `get_package(id, prerelease?)` — registration metadata + versions
- `list_versions(id)`
- `latest_version(id, prerelease?)`

## Data source

`https://azuresearch-usnc.nuget.org/query` — official NuGet v3 API.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "nuget": {
      "url": "https://gateway.pipeworx.io/nuget/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Nuget data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
