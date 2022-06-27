import {z} from "zod"

export const SimpleTransform = z.enum(["lowercase", "space-to-dash", "spread", "base64"])
export type SimpleTransform = z.infer<typeof SimpleTransform>

export const SimpleTypes = z.union([z.string(), z.number(), z.boolean()])
export type SimpleTypes = z.infer<typeof SimpleTypes>

export const FilterTransform = z.record(z.literal("filter"), z.record(z.string().min(1), SimpleTypes))
export type FilterTransform = z.infer<typeof FilterTransform>

export const IndentTransform = z.record(z.literal("indent"), z.number().min(0))
export type IndentTransform = z.infer<typeof IndentTransform>

export const ExpandTransform = z.record(z.literal("expand"), z.string())
export type ExpandTransform = z.infer<typeof ExpandTransform>

export const ComplexTransform = FilterTransform.or(IndentTransform).or(ExpandTransform)
export type ComplexTransform = z.infer<typeof ComplexTransform>

export const MapValueTransform = z.record(z.literal("mapValue"), SimpleTransform.or(ComplexTransform))
export type MapValueTransform = z.infer<typeof MapValueTransform>

export const Transform = z.union([SimpleTransform, ComplexTransform, MapValueTransform])
export type Transform = z.infer<typeof Transform>

export const indent = (value: string, n: number) => {
  const spaces = new Array(n+1).join(" ")
  return value.split("\n").map(_ => spaces + _).join("\n")
}

export const transform = (value: any, t: Transform, context: any): any => {
  if (typeof t === "string") {
    switch (t) {
      case "base64":
        return Buffer.from(value, "utf-8").toString("base64")
      case "space-to-dash":
        return value.replace(/\s+/g, "-")
      case "lowercase":
        return value.toLowerCase()
      case "spread":
        return Object.values(value as Array<any>).map(({key, value}) => `${key}: ${value}`).join("\n")
    }
  } else if (typeof t === "object") {
    if ("indent" in t && typeof t["indent"] === "number" && typeof value === "string") {
      return indent(value, t["indent"])
    } else if ("expand" in t && typeof t["expand"] === "string") {
      return (t["expand"] as string).replace(/\$\{([^}]+)\}/g, (_, p) => context[p])
    } else if ("filter" in t && typeof t["filter"] === "object") {
      if (Array.isArray(value)) {
        const xxx = t["filter"]
        return value.filter(v => Object.entries(xxx).every(([kk, vv]) => v[kk] === vv))
      } else {
        throw "target of filter must be an array: " + value
      }
    } else if ("mapValue" in t && (typeof t["mapValue"] === "object" || typeof t["mapValue"] === "string")) {
      if (Array.isArray(value)) {
        const xxx = t["mapValue"]
        return value.map(({key, value}) => ({key, value: transform(value, xxx, context)}))
      } else {
        throw "target of filter must be an array: " + value
      }
    }
  } 
  throw `unknown transform ${JSON.stringify(t)}`
}

