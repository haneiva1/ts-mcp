import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerOptions } from '../types'
import { TOOLS_METADATA_KEY } from '../decorators/tool'
import { RESOURCES_METADATA_KEY } from '../decorators/resource'
import { PROMPTS_METADATA_KEY } from '../decorators/prompt'
export class MCPServer {
  private server: Server
  private handlers: object[] = []
  constructor(private options: MCPServerOptions) {
    this.server = new Server({ name: options.name, version: options.version }, { capabilities: { tools: {}, resources: {}, prompts: {} } })
  }
  register(...handlers: object[]): this { this.handlers.push(...handlers); return this }
  private collect(key: symbol) {
    const items: any[] = []
    for (const h of this.handlers) {
      const meta: Map<any,any> = Reflect.getMetadata(key, Object.getPrototypeOf(h)) || new Map()
      for (const [m, v] of meta) items.push({ ...v, _h: h, _m: m })
    }
    return items
  }
  private setupHandlers() {
    const tools = this.collect(TOOLS_METADATA_KEY)
    const resources = this.collect(RESOURCES_METADATA_KEY)
    const prompts = this.collect(PROMPTS_METADATA_KEY)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema: inputSchema || { type: 'object', properties: {} } })) }))
    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      const t = tools.find(t => t.name === req.params.name)
      if (!t) throw new Error(`Unknown tool: ${req.params.name}`)
      const result = await (t._h as any)[t._m](req.params.arguments || {})
      return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] }
    })
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: resources.map(({ uri, name, description, mimeType }) => ({ uri, name, description, mimeType })) }))
    this.server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
      const r = resources.find(r => r.uri === req.params.uri)
      if (!r) throw new Error(`Unknown resource: ${req.params.uri}`)
      const content = await (r._h as any)[r._m]()
      return { contents: [{ uri: req.params.uri, mimeType: r.mimeType || 'text/plain', text: content }] }
    })
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: prompts.map(({ name, description }) => ({ name, description })) }))
    this.server.setRequestHandler(GetPromptRequestSchema, async (req) => {
      const p = prompts.find(p => p.name === req.params.name)
      if (!p) throw new Error(`Unknown prompt: ${req.params.name}`)
      const text = await (p._h as any)[p._m](req.params.arguments || {})
      return { messages: [{ role: 'user', content: { type: 'text', text } }] }
    })
  }
  async start() {
    this.setupHandlers()
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    process.stderr.write(`[ts-mcp] ${this.options.name} v${this.options.version} started\n`)
  }
}
