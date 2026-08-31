/**
 * jscodeshift transform for the @oneschema/importer 0.7.7 -> 0.8 migration.
 *
 * Unpublished on purpose: check the repository out at the release tag and run
 * this file from disk, see MIGRATING-0.8.md.
 *
 *   npx jscodeshift@0.15.2 -t <path>/scripts/codemod-0.8.cjs --parser=tsx src/
 *
 * It only rewrites what it can decide from the syntax alone. Anything that
 * needs a human gets a TODO(oneschema-0.8) comment instead, so a codebase
 * without types still has a list of call sites to walk.
 */

const TODO = "TODO(oneschema-0.8): "

const REMOVED_MEMBERS = [
  "_hasAttemptedLaunch",
  "_launch",
  "_initWithRetry",
  "_resetSession",
]

const LAUNCH_METHODS = ["launch", "launchSession"]

const IMPORTER_MODULES = [
  "@oneschema/importer",
  "@oneschema/react",
  "@oneschema/vue",
  "@oneschema/angular",
]

module.exports = function transform(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)
  const notes = []

  const note = (message, node) => {
    notes.push(`${fileInfo.path}:${node.loc ? node.loc.start.line : "?"} ${message}`)
  }

  const annotate = (path, message) => {
    // closest() only walks ancestors, so a path that is already a statement
    // would otherwise annotate the function enclosing it.
    let node = path.node
    if (!j.Statement.check(node)) {
      const statement = j(path).closest(j.Statement)
      if (!statement.size()) {
        return
      }
      node = statement.paths()[0].node
    }

    const comments = node.comments || []
    if (comments.some((comment) => comment.value.includes(TODO))) {
      return
    }

    node.comments = [...comments, j.commentLine(` ${TODO}${message}`, true, false)]
  }

  // Only names the file imports from an @oneschema package can be recognized as
  // the importer; every other `.launch()` or `parentId` in the codebase belongs
  // to the host and must not be rewritten.
  const oneschemaLocals = new Set()

  root.find(j.ImportDeclaration).forEach((path) => {
    if (!IMPORTER_MODULES.includes(path.node.source.value)) {
      return
    }

    path.node.specifiers.forEach((specifier) => {
      if (specifier.local) {
        oneschemaLocals.add(specifier.local.name)
      }
    })
  })

  root.find(j.VariableDeclarator).forEach((path) => {
    const { id, init } = path.node
    if (
      id.type !== "Identifier" ||
      !init ||
      init.type !== "CallExpression" ||
      init.callee.type !== "Identifier" ||
      init.callee.name !== "require" ||
      init.arguments.length !== 1
    ) {
      return
    }

    const [source] = init.arguments
    if (source.type === "StringLiteral" && IMPORTER_MODULES.includes(source.value)) {
      oneschemaLocals.add(id.name)
    }
  })

  // Instances: `const importer = oneschemaImporter(...)`, `new OneSchemaImporterClass(...)`,
  // and refs whose declaration names a OneSchema type (`useRef<OneSchemaImporterRef>`).
  const importerLocals = new Set()
  const refLocals = new Set()

  root.find(j.VariableDeclarator).forEach((path) => {
    const { id, init } = path.node
    if (id.type !== "Identifier" || !init) {
      return
    }

    const callee =
      init.type === "CallExpression" || init.type === "NewExpression"
        ? init.callee
        : undefined

    if (callee && callee.type === "Identifier" && oneschemaLocals.has(callee.name)) {
      importerLocals.add(id.name)
      return
    }

    if (
      init.type === "CallExpression" &&
      init.callee.type === "Identifier" &&
      init.callee.name === "useRef" &&
      j(path).toSource().includes("OneSchema")
    ) {
      refLocals.add(id.name)
    }
  })

  const isImporterReceiver = (node) => {
    if (node.type === "Identifier") {
      return importerLocals.has(node.name) || oneschemaLocals.has(node.name)
    }

    // `importerRef.current.launch()`; any other property receiver only counts
    // when a local of that name is itself a known importer.
    if (node.type === "MemberExpression" && node.property.type === "Identifier") {
      if (node.property.name === "current" && node.object.type === "Identifier") {
        return refLocals.has(node.object.name) || importerLocals.has(node.object.name)
      }

      return importerLocals.has(node.property.name)
    }

    return false
  }

  const isLaunchCall = (node) =>
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    LAUNCH_METHODS.includes(node.callee.property.name) &&
    isImporterReceiver(node.callee.object)

  const isUnrecognizedLaunchCall = (node) =>
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    LAUNCH_METHODS.includes(node.callee.property.name) &&
    !isImporterReceiver(node.callee.object)

  const parentIdReplacement = (value) =>
    j.callExpression(
      j.memberExpression(j.identifier("document"), j.identifier("getElementById")),
      [value],
    )

  // parentId: "x" -> parent: document.getElementById("x"), inside the options
  // object of a recognized importer factory only.
  root.find(j.ObjectProperty, { key: { name: "parentId" } }).forEach((path) => {
    const call = j(path).closest(j.CallExpression)
    const callee = call.size() ? call.paths()[0].node.callee : undefined
    const inImporterOptions =
      callee &&
      ((callee.type === "Identifier" && oneschemaLocals.has(callee.name)) ||
        (callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          LAUNCH_METHODS.includes(callee.property.name) &&
          isImporterReceiver(callee.object)))

    if (!inImporterOptions) {
      annotate(
        path,
        "parentId is gone: if this is a OneSchema option, pass parent: HTMLElement instead",
      )
      note(
        "parentId left for a human: not a recognized importer options object",
        path.node,
      )
      return
    }

    path.node.key = j.identifier("parent")
    path.node.value = parentIdReplacement(path.node.value)
    note("parentId rewritten to parent", path.node)
  })

  // parentId="x" -> parent={document.getElementById("x")}, on an imported
  // OneSchema component only.
  root.find(j.JSXAttribute, { name: { name: "parentId" } }).forEach((path) => {
    const element = j(path).closest(j.JSXOpeningElement)
    const name = element.size() ? element.paths()[0].node.name : undefined
    const component =
      name && name.type === "JSXIdentifier"
        ? name.name
        : name &&
            name.type === "JSXMemberExpression" &&
            name.property.type === "JSXIdentifier"
          ? name.property.name
          : undefined

    if (!component || !oneschemaLocals.has(component)) {
      annotate(
        path,
        "parentId is gone: if this is a OneSchema component, pass parent={element} instead",
      )
      note(
        "parentId prop left for a human: not a recognized importer component",
        path.node,
      )
      return
    }

    const value = path.node.value
    const inner =
      value && value.type === "JSXExpressionContainer" ? value.expression : value
    path.node.name = j.jsxIdentifier("parent")
    path.node.value = j.jsxExpressionContainer(parentIdReplacement(inner))
    note("parentId prop rewritten to parent", path.node)
  })

  // Only the exact `{ success }` shorthand can be replaced by a boolean of the
  // same name; an alias or a second binding would lose its declaration.
  const isPlainSuccessPattern = (pattern) => {
    if (pattern.properties.length !== 1) {
      return false
    }

    const [property] = pattern.properties
    return (
      property.type === "ObjectProperty" &&
      !property.computed &&
      property.key.type === "Identifier" &&
      property.key.name === "success" &&
      property.value.type === "Identifier" &&
      property.value.name === "success"
    )
  }

  const isSuccessDestructuring = (declarator) =>
    declarator.type === "VariableDeclarator" &&
    declarator.id.type === "ObjectPattern" &&
    declarator.id.properties.some(
      (property) =>
        property.type === "ObjectProperty" &&
        property.key.type === "Identifier" &&
        property.key.name === "success",
    ) &&
    declarator.init &&
    isLaunchCall(declarator.init)

  // const { success } = importer.launch() -> await importer.launch() in a try
  root
    .find(j.VariableDeclaration)
    .filter((path) => {
      const [declarator] = path.node.declarations
      return (
        path.node.declarations.length === 1 &&
        declarator.type === "VariableDeclarator" &&
        declarator.id.type === "ObjectPattern" &&
        isPlainSuccessPattern(declarator.id) &&
        declarator.init &&
        isLaunchCall(declarator.init)
      )
    })
    .forEach((path) => {
      const call = path.node.declarations[0].init
      const enclosing = j(path).closest(j.Function)
      const isAsync = enclosing.size() > 0 && enclosing.paths()[0].node.async

      if (!isAsync) {
        annotate(
          path,
          "launch() now returns a promise: await it in an async function, or attach a .catch()",
        )
        note(
          "launch() destructuring left for a human: enclosing function is not async",
          path.node,
        )
        return
      }

      // `success` stays a boolean so the statements after it keep compiling.
      const flag = j.variableDeclaration("let", [
        j.variableDeclarator(j.identifier("success"), j.booleanLiteral(true)),
      ])
      const attempt = j.tryStatement(
        j.blockStatement([j.expressionStatement(j.awaitExpression(call))]),
        j.catchClause(
          j.identifier("failure"),
          null,
          j.blockStatement([
            j.expressionStatement(
              j.assignmentExpression(
                "=",
                j.identifier("success"),
                j.booleanLiteral(false),
              ),
            ),
          ]),
        ),
      )
      attempt.comments = [
        j.commentLine(
          ` ${TODO}failure is a OneSchemaLaunchFailure: report it instead of the flag`,
          true,
          false,
        ),
      ]

      j(path).replaceWith(flag)
      path.insertAfter(attempt)
      note("launch() destructuring rewritten to await/try", path.node)
    })

  // Anything else destructured off a launch call keeps its bindings and gets a note.
  root
    .find(j.VariableDeclaration)
    .filter(
      (path) =>
        path.node.declarations.length === 1 &&
        isSuccessDestructuring(path.node.declarations[0]) &&
        !isPlainSuccessPattern(path.node.declarations[0].id),
    )
    .forEach((path) => {
      annotate(
        path,
        "launch() now returns a promise: await it and read OneSchemaLaunchInfo, or catch OneSchemaLaunchFailure",
      )
      note(
        "launch() destructuring left for a human: it binds more than success",
        path.node,
      )
    })

  // importer.launch() as a discarded statement -> .catch()
  root
    .find(j.ExpressionStatement)
    .filter((path) => isLaunchCall(path.node.expression))
    .forEach((path) => {
      // Rejections have to go somewhere: awaiting hands them to the caller,
      // and a synchronous call site gets a reporting catch to replace.
      const enclosing = j(path).closest(j.Function)
      if (enclosing.size() > 0 && enclosing.paths()[0].node.async) {
        path.node.expression = j.awaitExpression(path.node.expression)
        note("launch() awaited, rejection now propagates to the caller", path.node)
        return
      }

      path.node.expression = j.callExpression(
        j.memberExpression(path.node.expression, j.identifier("catch")),
        [
          j.arrowFunctionExpression(
            [j.identifier("failure")],
            j.blockStatement([
              j.expressionStatement(
                j.callExpression(
                  j.memberExpression(j.identifier("console"), j.identifier("error")),
                  [j.identifier("failure")],
                ),
              ),
            ]),
          ),
        ],
      )
      note("launch() given a reporting .catch()", path.node)
    })

  // A launch call this transform cannot attribute to an importer: never rewritten.
  root
    .find(j.CallExpression)
    .filter((path) => isUnrecognizedLaunchCall(path.node))
    .forEach((path) => {
      annotate(
        path,
        "if this is a OneSchema importer, launch() now returns a promise: await it or attach a .catch()",
      )
      note("launch() call left for a human: receiver is not a known importer", path.node)
    })

  // Removed internals and untagged success payloads: flag only.
  root
    .find(j.MemberExpression)
    .filter(
      (path) =>
        path.node.property.type === "Identifier" &&
        REMOVED_MEMBERS.includes(path.node.property.name),
    )
    .forEach((path) => {
      annotate(
        path,
        `${path.node.property.name} was removed: read importer.status instead`,
      )
      note(`${path.node.property.name} is no longer published`, path.node)
    })

  root
    .find(j.CallExpression, {
      callee: { type: "MemberExpression", property: { name: "on" } },
    })
    .filter((path) => {
      const [event] = path.node.arguments
      return event && event.type === "StringLiteral" && event.value === "success"
    })
    .forEach((path) => {
      annotate(
        path,
        "the success payload is now discriminated: narrow on result.type before reading result.data",
      )
      note("success handler needs narrowing on result.type", path.node)
    })

  if (notes.length) {
    console.warn(`oneschema-0.8:\n  ${notes.join("\n  ")}`)
  }

  return notes.length ? root.toSource({ quote: "double" }) : null
}

module.exports.parser = "tsx"
