import {z} from "zod"
import yaml from "js-yaml"
import { transform } from "./transform"
import { Dependencies, Generated } from "./generated"

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
)

export const InputSchema = jsonSchema
export const UISchema = jsonSchema

export const Schema = z.object({
  input: InputSchema,
  ui: UISchema
})
export type Schema = z.infer<typeof Schema>


export const DeployerConfig = z.object({
  schema: Schema,
  generated: Generated,
  dependencies: Dependencies,
})

export type DeployerConfig = z.infer<typeof DeployerConfig>

export class Deployer {
  config: DeployerConfig

  constructor(private configString: string, public k8sTemplate: string) {
    this.config = DeployerConfig.parse(yaml.load(configString))
  }

  generate = (properties: Record<string,any>): Record<string,any> => {
    const rv = {...properties}
    const CONFIG_MAP_REFS: string[] = []
    const SECRET_REFS: string[] = []

    for (const [k,v] of Object.entries(this.config.dependencies)) {
      if (v.includes("configMap")) {
        CONFIG_MAP_REFS.push(`- configMapRef:\n  name: ${k}`)
      }
      if (v.includes("secret")) {
        SECRET_REFS.push(`- secretRef:\n  name: ${k}`)
      }
    }

    rv["CONFIG_MAP_REFS"] = CONFIG_MAP_REFS.join("\n")
    rv["SECRET_REFS"] = SECRET_REFS.join("\n")

    for (const x of this.config.generated) {
      let value = x.source && rv[x.source] || rv[x.name] || ""
      for (const t of x.transforms ?? []) {
        value = transform(value, t, rv)
      }
      rv[x.name] = value
    }

    return rv
  }

  apply = (properties: Record<string,any>) => {
    const generated = this.generate(properties)
    return this.k8sTemplate.replace(/\$\{([^}]+)\}/g, (_, p) => generated[p])
  }
}
