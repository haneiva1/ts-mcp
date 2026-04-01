# ts-mcp

> TypeScript framework for building [MCP](https://modelcontextprotocol.io) servers. Decorator syntax, zero boilerplate.

[![npm](https://img.shields.io/npm/v/ts-mcp?style=flat-square)](https://npmjs.com/package/ts-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple?style=flat-square)](https://modelcontextprotocol.io)

## The problem

The official MCP SDK is verbose. Building a server looks like this:

```typescript
// Official SDK — lots of boilerplate
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'get_weather',
    description: 'Get weather for a city',
    inputSchema: { type: 'object', properties: { city: { type: 'string' } } }
  }]
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'get_weather') {
    const { city } = req.params.arguments as any
    // ... your logic
  }
})
```

## The solution

```typescript
// ts-mcp — just write your logic
class WeatherTools {
  @Tool({ name: 'get_weather', description: 'Get weather for a city' })
  async getWeather({ city }: { city: string }) {
    return { city, temp: '22°C', condition: 'Sunny' }
  }
}

new MCPServer({ name: 'my-server', version: '1.0.0' })
  .register(new WeatherTools())
  .start()
```

That's it. No request handlers, no schema registration, no routing.

---

## Install

```bash
npm install ts-mcp
```

Enable decorators in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Decorators

### `@Tool` — expose a function as an MCP tool

```typescript
import { Tool } from 'ts-mcp'

class DatabaseTools {
  @Tool({
    name: 'query_db',
    description: 'Run a read-only SQL query',
  })
  async queryDB({ sql }: { sql: string }) {
    const rows = await db.query(sql)
    return rows
  }

  @Tool({
    name: 'list_tables',
    description: 'List all tables in the database',
  })
  async listTables() {
    return await db.query('SELECT table_name FROM information_schema.tables')
  }
}
```

### `@Resource` — expose data as an MCP resource

```typescript
import { Resource } from 'ts-mcp'

class AppResources {
  @Resource({
    uri: 'app://config',
    name: 'App Config',
    description: 'Current application configuration',
    mimeType: 'application/json',
  })
  getConfig() {
    return JSON.stringify(config, null, 2)
  }

  @Resource({
    uri: 'app://logs',
    name: 'Recent Logs',
    mimeType: 'text/plain',
  })
  async getLogs() {
    return await fs.readFile('/var/log/app.log', 'utf-8')
  }
}
```

### `@Prompt` — expose reusable prompts

```typescript
import { Prompt } from 'ts-mcp'

class AppPrompts {
  @Prompt({
    name: 'code_review',
    description: 'Generate a code review for a PR',
  })
  codeReview({ language = 'TypeScript' }: { language?: string }) {
    return `You are an expert ${language} developer. Review the following code for bugs, performance issues, and style. Be specific and constructive.`
  }
}
```

---

## Full example

```typescript
import { MCPServer, Tool, Resource, Prompt } from 'ts-mcp'

class FileSystemTools {
  @Tool({ name: 'read_file', description: 'Read a file by path' })
  async readFile({ path }: { path: string }) {
    return await fs.readFile(path, 'utf-8')
  }

  @Tool({ name: 'write_file', description: 'Write content to a file' })
  async writeFile({ path, content }: { path: string; content: string }) {
    await fs.writeFile(path, content)
    return `Written ${content.length} bytes to ${path}`
  }

  @Tool({ name: 'list_directory', description: 'List files in a directory' })
  async listDirectory({ path }: { path: string }) {
    return await fs.readdir(path)
  }
}

class FileResources {
  @Resource({ uri: 'fs://cwd', name: 'Current Directory' })
  getCwd() {
    return process.cwd()
  }
}

class FilePrompts {
  @Prompt({ name: 'refactor', description: 'Refactor code in a file' })
  refactor({ goal }: { goal?: string }) {
    return `Refactor this code${goal ? ` to ${goal}` : ''}. Preserve all functionality. Use modern patterns.`
  }
}

new MCPServer({ name: 'filesystem-mcp', version: '1.0.0' })
  .register(new FileSystemTools(), new FileResources(), new FilePrompts())
  .start()
```

---

## Use with Claude Desktop

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/your/server/dist/index.js"]
    }
  }
}
```

---

## Use with Cursor / Windsurf

Add to `.cursor/mcp.json` or `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/server.ts"]
    }
  }
}
```

---

## API

### `MCPServer`

```typescript
new MCPServer(options: MCPServerOptions)
  .register(...handlers: object[])  // Register handler classes
  .start()                           // Start the server (stdio transport)
```

### `@Tool(meta: ToolMeta)`

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Tool name (used by AI to call it) |
| `description` | `string` | ✅ | What the tool does |
| `inputSchema` | `object` | — | JSON Schema for inputs (auto-detected if omitted) |

### `@Resource(meta: ResourceMeta)`

| Property | Type | Required | Description |
|---|---|---|---|
| `uri` | `string` | ✅ | Unique URI for this resource |
| `name` | `string` | ✅ | Human-readable name |
| `description` | `string` | — | What this resource contains |
| `mimeType` | `string` | — | Content type (default: `text/plain`) |

### `@Prompt(meta: PromptMeta)`

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Prompt name |
| `description` | `string` | — | What this prompt does |

---

## Built with

- [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) — official MCP TypeScript SDK
- [`reflect-metadata`](https://github.com/rbuckton/reflect-metadata) — decorator metadata

---

## License

MIT

---

*If this made building MCP servers easier, consider ⭐ starring the repo.*
