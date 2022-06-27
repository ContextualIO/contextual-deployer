import { Dependencies, generate, Generated } from "./generated"

describe("stuff", () => {
  test("can parse simple transform", async () => {
    expect(() => Generated.parse([{
      name: "foo",
      transforms: ["lowercase"]
    }])).not.toThrow()
  })

  test("fails with unknown simple transform", async () => {
    expect(() => Generated.parse([{
      name: "OPTIONS",
      transforms: ["foo"]
    }])).toThrow()
  })

  test("can generate props", () => {
    const props = {
      NAMESPACE: "bar",
      NAME: "Foo Fooey",
      TOPIC: "baz",
      FROM_BEGINNING: "false",
      FSM_CODE: "BOO\nBOO\nBOO",
      OPTIONS: [{
        key: "OPT_1", 
        value: "x", 
        secret: false
      }, {
        key: "OPT_2", 
        value: "Y", 
        secret: false
      }, {
        key: "SECRET", 
        value: "xxx",
        secret: true
      }],
      SECRETS: ["SEC_1", "SEC_2"],
      IMAGE: "image:1.2.3",
      CONFIG_MAP_REFS: ["kafka", "redis", "redis-timer"],
      SECRET_REFS: ["S1", "S2"],
      MAX_REPLICAS: 5,
      MIN_REPLICAS: 1,
      TARGET_CPU: 90
    }
    const generated: Generated = [
      {
        name: "PREFIX",
        transforms: [
          {expand: "${NAME}"},
          "lowercase",
          "space-to-dash",
        ]
      },
      {
        name: "GROUP_ID",
        transforms: [{expand: "${PREFIX}-fsm"}]
      },
      {
        name: "CLIENT_ID",
        transforms: [{expand: "${PREFIX}-fsm"}],
      }, 
      {
        name: "FSM_CODE",
        transforms: [{expand: "${FSM_CODE}"}, {indent: 4}]
      },
      {
        name: "SECRETS",
        source: "OPTIONS",
        transforms: [ 
          {
            filter: {secret: true}
          },
          {
            mapValue: "base64",
          },
          "spread", 
          {
            indent: 2
          } 
        ],
      },
      {
        name: "OPTIONS",
        transforms: [ {filter: {secret: false}}, "spread", {indent: 2} ]
      },
      {
        name: "CONFIG_MAP_REFS",
        transforms: [{indent: 8}],
      }, 
      {
        name: "SECRET_REFS",
        transforms: [{indent: 8}],
      }
    ]
    const dependencies = Dependencies.parse({
      kafka: ["configMap", "secret"],
      redis: ["configMap", "secret"],
      "redis-timer": ["configMap"],
    })

    expect(() => generate(props, dependencies, generated)).not.toThrow()

    const rv = generate(props, dependencies, generated)
    expect(rv).toStrictEqual({
      PREFIX: "foo-fooey",
      GROUP_ID: "foo-fooey-fsm",
      CLIENT_ID: "foo-fooey-fsm",
      FROM_BEGINNING: "false",
      IMAGE: "image:1.2.3",
      MAX_REPLICAS: 5,
      MIN_REPLICAS: 1,
      TARGET_CPU: 90,
      TOPIC: "baz",
      NAME: "Foo Fooey",
      NAMESPACE: "bar",
      FSM_CODE: "    BOO\n    BOO\n    BOO",
      OPTIONS: "  OPT_1: x\n  OPT_2: Y",
      SECRETS: `  SECRET: ${Buffer.from("xxx").toString("base64")}`,
      CONFIG_MAP_REFS: "        - configMapRef:\n          name: kafka\n        - configMapRef:\n          name: redis\n        - configMapRef:\n          name: redis-timer",
      SECRET_REFS: "        - secretRef:\n          name: kafka\n        - secretRef:\n          name: redis"
    })
  })
})