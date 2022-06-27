import {z} from "zod"
import { transform, Transform } from "./transform"

export const Dependency = z.literal("configMap").or(z.literal("secret"))
export type Dependency = z.infer<typeof Dependency>

export const Dependencies = z.record(z.string(), z.array(Dependency))
export type Dependencies = z.infer<typeof Dependencies>

export const Generated = z.array(z.object({
  name: z.string().min(1),
  source: z.string().optional(),
  transforms: z.array(Transform).optional()
}))
export type Generated = z.infer<typeof Generated>

export const generate = (properties: Record<string,any>, dependencies: Dependencies, generated: Generated): Record<string,any> => {
  const rv = {...properties}
  const CONFIG_MAP_REFS: string[] = []
  const SECRET_REFS: string[] = []

  for (const [k,v] of Object.entries(dependencies)) {
    if (v.includes("configMap")) {
      CONFIG_MAP_REFS.push(`- configMapRef:\n  name: ${k}`)
    }
    if (v.includes("secret")) {
      SECRET_REFS.push(`- secretRef:\n  name: ${k}`)
    }
  }

  rv["CONFIG_MAP_REFS"] = CONFIG_MAP_REFS.join("\n")
  rv["SECRET_REFS"] = SECRET_REFS.join("\n")

  for (const x of generated) {
    let value = x.source && rv[x.source] || rv[x.name] || undefined
    for (const t of x.transforms ?? []) {
      value = transform(value, t, rv)
    }
    rv[x.name] = value
  }

  return rv
}

