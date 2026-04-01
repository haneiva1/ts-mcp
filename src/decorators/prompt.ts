import 'reflect-metadata'
import { PromptMeta } from '../types'
export const PROMPTS_METADATA_KEY = Symbol('mcp:prompts')
export function Prompt(meta: PromptMeta): MethodDecorator {
  return (target, propertyKey) => {
    const ex = Reflect.getMetadata(PROMPTS_METADATA_KEY, target) || new Map()
    ex.set(propertyKey, meta)
    Reflect.defineMetadata(PROMPTS_METADATA_KEY, ex, target)
  }
}
