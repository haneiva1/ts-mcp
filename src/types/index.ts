export interface ToolMeta { name: string; description: string; inputSchema?: Record<string, unknown> }
export interface ResourceMeta { uri: string; name: string; description?: string; mimeType?: string }
export interface PromptMeta { name: string; description?: string }
export interface MCPServerOptions { name: string; version: string; description?: string }
