import { ComplexTransform, FilterTransform, transform } from "./transform"

describe("transforms", () => {
  test("can parse filter transform", async () => {
    expect(() => FilterTransform.parse({filter: { secret: true } })).not.toThrow()
  })

  test("can parse complex transform", async () => {
    expect(() => ComplexTransform.parse({filter: { secret: true } })).not.toThrow()
    expect(() => ComplexTransform.parse({indent: 7 })).not.toThrow()
    expect(() => ComplexTransform.parse({expand: "${hi}" })).not.toThrow()
    expect(() => ComplexTransform.parse({fooey: "bar"})).toThrow()
  })

  test("can transform:lowercase", async () => {
    expect(transform("FooEY", "lowercase", {})).toStrictEqual("fooey")
  })

  test("can transform:space-to-dash", async () => {
    expect(transform("foo bar   baz", "space-to-dash", {})).toStrictEqual("foo-bar-baz")
  })

  test("can transform:expand", async () => {
    expect(transform("", {expand: "x-${foo}-y"}, {foo: "z"})).toStrictEqual("x-z-y")
  })

  test("can transform:spread", async () => {
    expect(transform([{key: "foo", value: "FOO"}, {key: "bar", value: "BAR"}], "spread", {})).toStrictEqual("foo: FOO\nbar: BAR")
  })

  test("can transform:indent", async () => {
    expect(transform("foo\nbar\nbaz", {indent: 1}, {})).toStrictEqual(" foo\n bar\n baz")
  })

  test("can transform:filter", async () => {
    const secrets = [
      {key: "xxx", value: "yyy", secret: true},
      {key: "zzz", value: "secret", secret: true},
    ]
    const nonSecrets = [
      {key: "foo", value: "bar", secret: false},
    ]
    const options = secrets.concat(nonSecrets)

    expect(transform(options, {filter: {secret: false}}, {})).toStrictEqual(nonSecrets)
    expect(transform(options, {filter: {secret: true}}, {})).toStrictEqual(secrets)
  })

  test("can transform:bas64", () => {
    expect(transform("xyz", "base64", {})).toStrictEqual(Buffer.from("xyz").toString("base64"))
  })

  test("filtering non-array blows up", () => {
    expect(() => transform({hey: "there"}, {filter: {secret: true}}, {})).toThrow("target of filter must be an array")
  })
})