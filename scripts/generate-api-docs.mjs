#!/usr/bin/env node
// Generates the option/event reference tables in the package READMEs from the
// TypeScript sources, so the docs cannot drift from the types.
//
//   node scripts/generate-api-docs.mjs           # write
//   node scripts/generate-api-docs.mjs --check   # fail if out of date
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import prettier from "prettier"
import ts from "typescript"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const check = process.argv.includes("--check")

function parse(file) {
  const path = resolve(root, file)
  return ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  )
}

function findDeclaration(source, name) {
  const found = source.statements.find(
    (statement) =>
      (ts.isInterfaceDeclaration(statement) || ts.isVariableStatement(statement)) &&
      declarationName(statement) === name,
  )

  if (!found) {
    throw new Error(`could not find ${name} in ${source.fileName}`)
  }

  return found
}

function declarationName(statement) {
  if (ts.isInterfaceDeclaration(statement)) {
    return statement.name.text
  }
  return statement.declarationList.declarations[0]?.name.getText()
}

// JSDoc is not part of the AST proper: the leading comment ranges are the only
// place the text survives.
function docOf(node) {
  const text = node
    .getFullText()
    .slice(0, node.getLeadingTriviaWidth())
    .match(/\/\*\*([\s\S]*?)\*\//)?.[1]

  if (!text) {
    return ""
  }

  return text
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

function members(source, name) {
  return findDeclaration(source, name).members.map((member) => ({
    name: member.name.getText().replace(/^"|"$/g, ""),
    optional: !!member.questionToken,
    type: member.type.getText().replace(/\s+/g, " "),
    doc: docOf(member),
  }))
}

function defaults(source) {
  const declaration = findDeclaration(source, "DEFAULT_PARAMS").declarationList
    .declarations[0]
  const values = {}
  for (const property of declaration.initializer.properties) {
    values[property.name.getText()] = property.initializer.getText()
  }
  return values
}

// The React component sets its own defaults in the props destructuring.
function componentDefaults(source, componentName) {
  const component = source.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === componentName,
  )

  if (!component) {
    throw new Error(`could not find ${componentName} in ${source.fileName}`)
  }

  const values = {}
  for (const element of component.parameters[0].name.elements ?? []) {
    if (element.initializer) {
      values[element.name.getText()] = element.initializer.getText()
    }
  }
  return values
}

const cell = (value) => value.replaceAll("|", "\\|")

function optionTable(rows, defaultValues = {}, label = "Option") {
  const lines = [
    `| ${label} | Type | Required | Default | Description |`,
    "| --- | --- | --- | --- | --- |",
  ]
  for (const row of rows) {
    const fallback = defaultValues[row.name]
    lines.push(
      `| \`${row.name}\` | \`${cell(row.type)}\` | ${
        row.optional ? "" : "yes"
      } | ${fallback ? `\`${cell(fallback)}\`` : ""} | ${cell(row.doc)} |`,
    )
  }
  return lines.join("\n")
}

function eventTable(rows) {
  const lines = ["| Event | Listener arguments | Description |", "| --- | --- | --- |"]
  for (const row of rows) {
    const args = row.type.replace(/^\[|\]$/g, "").trim()
    lines.push(
      `| \`${row.name}\` | ${args ? `\`${cell(args)}\`` : "none"} | ${cell(row.doc)} |`,
    )
  }
  return lines.join("\n")
}

const config = parse("packages/importer/src/config.ts")
const react = parse("packages/importer-react/src/OneSchemaImporter.tsx")
const defaultValues = defaults(config)

const sections = {
  "importer-init-options": optionTable(
    members(config, "OneSchemaInitParams"),
    defaultValues,
  ),
  "importer-launch-options": optionTable([
    ...members(config, "OneSchemaLaunchParams"),
    ...members(config, "OneSchemaLaunchSessionParams"),
  ]),
  "importer-events": eventTable(members(config, "OneSchemaEventMap")),
  "react-props": optionTable(
    members(react, "OneSchemaImporterBaseProps"),
    componentDefaults(react, "OneSchemaImporter"),
    "Prop",
  ),
}

const files = {
  "packages/importer/README.md": [
    "importer-init-options",
    "importer-launch-options",
    "importer-events",
  ],
  "packages/importer-react/README.md": ["react-props", "importer-events"],
}

let stale = false

for (const [file, keys] of Object.entries(files)) {
  const path = resolve(root, file)
  const original = readFileSync(path, "utf8")
  let updated = original

  for (const key of keys) {
    const begin = `<!-- BEGIN GENERATED ${key} -->`
    const end = `<!-- END GENERATED ${key} -->`
    const pattern = new RegExp(`${begin}[\\s\\S]*?${end}`)

    if (!pattern.test(updated)) {
      throw new Error(`${file} is missing the ${key} markers`)
    }

    updated = updated.replace(pattern, `${begin}\n\n${sections[key]}\n\n${end}`)
  }

  // Prettier realigns markdown tables, so format before comparing or the
  // generated output would never match what lands on disk.
  updated = await prettier.format(updated, {
    ...(await prettier.resolveConfig(path)),
    filepath: path,
  })

  if (updated === original) {
    continue
  }

  if (check) {
    stale = true
    console.error(`${file} is out of date, run \`yarn docs:api\``)
  } else {
    writeFileSync(path, updated)
    console.log(`updated ${file}`)
  }
}

if (stale) {
  process.exit(1)
}
