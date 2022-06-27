import { Deployer, DeployerConfig } from "."
import yaml from "js-yaml"
import { readFileSync } from "fs"
import { ComplexTransform, FilterTransform, transform } from "./transform"
import { Generated } from "./generated"

describe("stuff", () => {

  test.skip("can parse yaml", async () => {
    DeployerConfig.parse(yaml.load(readFileSync("./test/setup.yaml").toString("utf-8")))
  })

  test.skip("can generate properties", async () => {
    const x = new Deployer(readFileSync("./test/setup.yaml", "utf-8"), readFileSync("./test/deployment.yaml", "utf-8"))
    const generated = x.generate({
      NAMESPACE: "bar",
      NAME: "Foo Fooey",
      TOPIC: "baz",
      FROM_BEGINNING: "false",
      FSM_CODE: "BOO\nBOO\nBOO",
      OPTIONS: [{key: "OPT_1", value: "x"}, {key: "OPT_2", value: "Y"}],
      SECRETS: ["SEC_1", "SEC_2"],
      IMAGE: "image:1.2.3",
      CONFIG_MAP_REFS: ["kafka", "redis", "redis-timer"],
      SECRET_REFS: ["S1", "S2"],
      MAX_REPLICAS: 5,
      MIN_REPLICAS: 1,
      TARGET_CPU: 90
    })
    expect(generated).toStrictEqual({
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
      CONFIG_MAP_REFS: "        - configMapRef:\n          name: kafka\n        - configMapRef:\n          name: redis\n        - configMapRef:\n          name: redis-timer",
      SECRET_REFS: "        - secretRef:\n          name: kafka\n        - secretRef:\n          name: redis"
    })
  })

  test.skip("can create Deployer", async () => {
    const x = new Deployer(readFileSync("./test/setup.yaml", "utf-8"), readFileSync("./test/deployment.yaml", "utf-8"))
    const y = x.apply({
      NAMESPACE: "bar",
      NAME: "Foo Fooey",
      TOPIC: "baz",
      FROM_BEGINNING: "false",
      FSM_CODE: "BOO\nBOO\nBOO",
      OPTIONS: [{key: "OPT_1", value: "x"}, {key: "OPT_2", value: "Y"}],
      SECRETS: ["SEC_1", "SEC_2"],
      IMAGE: "image:1.2.3",
      CONFIG_MAP_REFS: ["kafka", "redis", "redis-timer"],
      SECRET_REFS: ["S1", "S2"],
      MAX_REPLICAS: 5,
      MIN_REPLICAS: 1,
      TARGET_CPU: 90
    })
    expect(y).toStrictEqual(readFileSync("./test/deployment-rendered.yaml", "utf-8"))
  })
})
