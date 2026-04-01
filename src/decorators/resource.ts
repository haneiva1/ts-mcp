import 'reflect-metadata'
import { ResourceMeta } from '../types'
export const RESOURCES_METADATA_KEY = Symbol('mcp:resources')
export function Resource(meta: ResourceMeta): MethodDecorator {
  return (target, propertyKey) => {
    const ex = Reflect.getMetadata(RESOURCES_METADATA_KEY, target) || new Map()
    ex.set(propertyKey, meta)
    Reflect.defineMetadata(RESOURCES_METADATA_KEY, ex, target)
  }
}
