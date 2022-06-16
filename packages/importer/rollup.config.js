import nodeResolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "rollup-plugin-typescript2"
import replace from "@rollup/plugin-replace"
import { terser } from "rollup-plugin-terser"

import pkg from "./package.json"

const input = ["src/index.ts"]

export default [
  {
    // UMD (for importing with script tag)
    input,
    plugins: [
      nodeResolve(),
      commonjs(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true,
      }),
      typescript(),
      terser(),
    ],
    output: [
      {
        file: `dist/oneschemasdk-${pkg.version}.min.js`,
        format: "umd",
        name: "oneSchemaImporter",
        exports: "default",
        esModule: false,
        sourcemap: true,
      },
      {
        file: `dist/oneschemasdk-latest.min.js`,
        format: "umd",
        name: "oneSchemaImporter",
        exports: "default",
        esModule: false,
        sourcemap: true,
      },
    ],
  },
  // ESM and CJS (for importing as module)
  {
    input,
    plugins: [nodeResolve(), commonjs(), typescript()],
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
  },
]
