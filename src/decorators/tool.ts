import 'reflect-metadata'
import { ToolMeta } from '../types'
export const TOOLS_METADATA_KEY = Symbol('mcp:tools')
export function Tool(meta: ToolMeta): MethodDecorator {
  return (target, propertyKey) => {
    const ex = Reflect.getMetadata(TOOLS_METADATA_KEY, target) || new Map()
    ex.set(propertyKey, meta)
    Reflect.defineMetadata(TOOLS_METADATA_KEY, ex, target)
  }
}
