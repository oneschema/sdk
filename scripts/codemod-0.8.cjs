/**
 * jscodeshift transform for the @oneschema/importer 0.7.7 -> 0.8 migration.
 *
 * Unpublished on purpose: run it from its raw URL, see MIGRATING-0.8.md.
 *
 *   npx jscodeshift@0.15.2 -t <url> --parser=tsx src/
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

  const isLaunchCall = (node) =>
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    LAUNCH_METHODS.includes(node.callee.property.name)

  // parentId: "x" -> parent: document.getElementById("x")
  root.find(j.ObjectProperty, { key: { name: "parentId" } }).forEach((path) => {
    path.node.key = j.identifier("parent")
    path.node.value = j.callExpression(
      j.memberExpression(j.identifier("document"), j.identifier("getElementById")),
      [path.node.value],
    )
    note("parentId rewritten to parent", path.node)
  })

  // parentId="x" -> parent={document.getElementById("x")}
  root.find(j.JSXAttribute, { name: { name: "parentId" } }).forEach((path) => {
    const value = path.node.value
    const inner =
      value && value.type === "JSXExpressionContainer" ? value.expression : value
    path.node.name = j.jsxIdentifier("parent")
    path.node.value = j.jsxExpressionContainer(
      j.callExpression(
        j.memberExpression(j.identifier("document"), j.identifier("getElementById")),
        [inner],
      ),
    )
    note("parentId prop rewritten to parent", path.node)
  })

  // const { success } = importer.launch() -> await importer.launch() in a try
  root
    .find(j.VariableDeclaration)
    .filter((path) => {
      const [declarator] = path.node.declarations
      return (
        path.node.declarations.length === 1 &&
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
