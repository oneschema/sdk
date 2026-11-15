import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import nodeResolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import dts from "rollup-plugin-dts"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"

import pkg from "./package.json" with { type: "json" }

export default [
  // UMD (for importing with script tag)
  {
    input: ["src/index-default.ts"],
    plugins: [
      nodeResolve(),
      commonjs(),
      json(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true,
      }),
      typescript({
        exclude: ["test/**/*"],
        declarationDir: "dist",
        rootDir: ".",
      }),
      terser(),
    ],
    output: [
      {
        file: `dist/oneschema-filefeeds-${pkg.version}.min.js`,
        format: "umd",
        name: "oneschemaFileFeeds",
        exports: "default",
        esModule: false,
        sourcemap: true,
      },
      {
        // take off smallest part of version, so 0.2.6 becomes 0.2.latest :)
        file: `dist/oneschema-filefeeds-${pkg.version
          .split(".")
          .slice(0, 2)
          .join(".")}.latest.min.js`,
        format: "umd",
        name: "oneschemaFileFeeds",
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
      json(),
      typescript({
        exclude: ["test/**/*"],
        declarationDir: "dist",
        rootDir: ".",
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
        file: "dist/module.mjs",
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
  // ESM Types
  {
    input: ["src/index.ts"],
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
  },
]
