import nodeResolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "rollup-plugin-typescript2"
import dts from "rollup-plugin-dts"
import replace from "@rollup/plugin-replace"
import { terser } from "rollup-plugin-terser"

import pkg from "./package.json"

export default [
  {
    // UMD (for importing with script tag)
    input: ["src/index-default.ts"],
    plugins: [
      nodeResolve(),
      commonjs(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true,
      }),
      typescript({
        tsconfigOverride: {
          exclude: ["**/test"],
        },
      }),
      terser(),
    ],
    output: [
      {
        file: `dist/oneschema-importer-${pkg.version}.min.js`,
        format: "umd",
        name: "oneschemaImporter",
        exports: "default",
        esModule: false,
        sourcemap: true,
      },
      {
        file: `dist/oneschema-importer-latest.min.js`,
        format: "umd",
        name: "oneschemaImporter",
        exports: "default",
        esModule: false,
        sourcemap: true,
      },
    ],
  },
  // ESM and CJS (for importing as module)
  {
    input: ["src/index.ts"],
    plugins: [
      nodeResolve(),
      commonjs(),
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
  },
  // Types
  {
    input: ["src/index.ts"],
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
]
