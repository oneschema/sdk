import nodeResolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import typescript from "rollup-plugin-typescript2"
import external from "rollup-plugin-peer-deps-external"

export default {
  input: ["src/index.ts"],
  plugins: [
    external(),
    nodeResolve(),
    commonjs(),
    json(),
    typescript({
      tsconfigOverride: {
        exclude: ["**/test"],
      },
    }),
  ],
  output: [
    {
      file: "dist/module.js",
      format: "esm",
      exports: "named",
      sourcemap: true,
    },
    {
      file: "dist/main.js",
      format: "cjs",
      exports: "named",
      sourcemap: true,
    },
  ],
}
