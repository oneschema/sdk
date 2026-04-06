/**
 * Integration tests for MCP server tools.
 *
 * Uses a lightweight HTTP mock server to simulate the OneSchema API,
 * then exercises each tool via the handleToolCall dispatch function.
 *
 * To run against a real API instead of the mock, set:
 *   ONESCHEMA_API_KEY=<key> ONESCHEMA_API_URL=<url> node --test dist/__tests__/tools.test.js
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { OneSchemaClient } from "../api-client.js"
import { handleToolCall } from "../tools.js"

// -- Mock server setup -------------------------------------------------------

interface MockRoute {
  method: string
  path: string | RegExp
  status: number
  body: unknown
}

const MOCK_ROUTES: MockRoute[] = [
  // list_workflows
  {
    method: "GET",
    path: "/v0/multi-file-feeds",
    status: 200,
    body: [
      { id: 1, name: "Test Workflow", workspace_id: null },
      { id: 2, name: "Another Workflow", workspace_id: null },
    ],
  },
  // get_workflow
  {
    method: "GET",
    path: /^\/v0\/multi-file-feeds\/(\d+)$/,
    status: 200,
    body: {
      id: 1,
      name: "Test Workflow",
      workspace_id: null,
      custom_metadata: {},
      templates: [
        { name: "Invoice", description: null, key: "invoices" },
      ],
      source: [],
      destination: [],
      event_webhooks: [],
      post_validation_transform_key: null,
    },
  },
  // export_flowgraph
  {
    method: "GET",
    path: /^\/v0\/multi-file-feeds\/(\d+)\/flowgraph$/,
    status: 200,
    body: {
      version: 0,
      exported_at: "2025-01-01T00:00:00Z",
      source_workflow_name: "Test Workflow",
      templates: [
        { template_key: "invoices", is_required: true },
      ],
      flowgraph: {
        nodes: [
          {
            node_key: "source-node",
            type: "source",
            config: {},
          },
          {
            node_key: "import-node",
            type: "import",
            config: {},
          },
          {
            node_key: "help-text-node",
            type: "help-text",
            config: {},
          },
        ],
        edges: [
          {
            from_node_key: "source-node",
            to_node_key: "import-node",
          },
        ],
      },
    },
  },
  // create_workflow_from_flowgraph (import-from-json)
  {
    method: "POST",
    path: "/v0/multi-file-feeds/import-from-json",
    status: 200,
    body: {
      id: 10,
      name: "Created Workflow",
      workspace_id: null,
      custom_metadata: {},
      templates: [],
      source: [],
      destination: [],
      event_webhooks: [],
      post_validation_transform_key: null,
    },
  },
  // duplicate_workflow
  {
    method: "POST",
    path: /^\/v0\/multi-file-feeds\/(\d+)\/duplicate$/,
    status: 200,
    body: {
      id: 11,
      name: "Duplicated Workflow",
      workspace_id: null,
      custom_metadata: {},
      templates: [],
      source: [],
      destination: [],
      event_webhooks: [],
      post_validation_transform_key: null,
    },
  },
  // update_workflow
  {
    method: "PATCH",
    path: /^\/v0\/multi-file-feeds\/(\d+)$/,
    status: 200,
    body: {
      id: 1,
      name: "Updated Workflow",
      workspace_id: null,
      custom_metadata: {},
      templates: [],
      source: [],
      destination: [],
      event_webhooks: [],
      post_validation_transform_key: null,
    },
  },
  // delete_workflow
  {
    method: "DELETE",
    path: /^\/v0\/multi-file-feeds\/(\d+)$/,
    status: 200,
    body: { success: true },
  },
  // get_template
  {
    method: "GET",
    path: /^\/templates\/export\/.+$/,
    status: 200,
    body: {
      name: "Invoices",
      template_key: "invoices",
      columns: [
        { label: "Invoice Number", key: "invoice_number" },
        { label: "Amount", key: "amount", data_type: "NUMBER" },
      ],
    },
  },
  // create_template
  {
    method: "POST",
    path: "/templates/import",
    status: 200,
    body: { id: 42 },
  },
]

function createMockServer(): http.Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost`)
    const pathname = url.pathname
    const method = req.method ?? "GET"

    for (const route of MOCK_ROUTES) {
      const pathMatch =
        typeof route.path === "string"
          ? pathname === route.path
          : route.path.test(pathname)

      if (method === route.method && pathMatch) {
        res.writeHead(route.status, {
          "Content-Type": "application/json",
        })
        res.end(JSON.stringify(route.body))
        return
      }
    }

    // 404 for unmatched routes
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        error: `Not found: ${method} ${pathname}`,
      }),
    )
  })
}

// -- Test setup --------------------------------------------------------------

describe("MCP tools integration", () => {
  let client: OneSchemaClient
  let mockServer: http.Server
  let baseUrl: string

  before(async () => {
    // Use real API if env vars are set, otherwise use mock
    if (
      process.env.ONESCHEMA_API_KEY &&
      process.env.ONESCHEMA_API_URL
    ) {
      client = new OneSchemaClient({
        baseUrl: process.env.ONESCHEMA_API_URL,
        apiKey: process.env.ONESCHEMA_API_KEY,
      })
    } else {
      mockServer = createMockServer()
      await new Promise<void>((resolve) => {
        mockServer.listen(0, "127.0.0.1", () => resolve())
      })
      const addr = mockServer.address()
      if (typeof addr === "object" && addr !== null) {
        baseUrl = `http://127.0.0.1:${addr.port}`
      }
      client = new OneSchemaClient({
        baseUrl,
        apiKey: "test-api-key",
      })
    }
  })

  after(async () => {
    if (mockServer) {
      await new Promise<void>((resolve) => {
        mockServer.close(() => resolve())
      })
    }
  })

  // -- Tool tests ------------------------------------------------------------

  it("list_workflows returns an array", async () => {
    const result = await handleToolCall(
      client,
      "list_workflows",
      {},
    )
    assert.equal(result.isError, undefined)
    assert.equal(result.content.length, 1)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(Array.isArray(data))
    assert.ok(data.length > 0)
    assert.ok(typeof data[0].id === "number")
    assert.ok(typeof data[0].name === "string")
  })

  it("list_workflows supports folder_id filter", async () => {
    const result = await handleToolCall(
      client,
      "list_workflows",
      { folder_id: 1 },
    )
    assert.equal(result.isError, undefined)
  })

  it("get_workflow returns workflow details", async () => {
    const result = await handleToolCall(client, "get_workflow", {
      workflow_id: 1,
    })
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.id === "number")
    assert.ok(typeof data.name === "string")
    assert.ok(Array.isArray(data.templates))
  })

  it("export_flowgraph returns flowgraph JSON", async () => {
    const result = await handleToolCall(
      client,
      "export_flowgraph",
      { workflow_id: 1 },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.equal(data.version, 0)
    assert.ok(data.flowgraph)
    assert.ok(Array.isArray(data.flowgraph.nodes))
    assert.ok(Array.isArray(data.flowgraph.edges))
  })

  it("create_workflow_from_flowgraph creates a workflow", async () => {
    const result = await handleToolCall(
      client,
      "create_workflow_from_flowgraph",
      {
        name: "Test Created Workflow",
        flowgraph: {
          version: 0,
          exported_at: new Date().toISOString(),
          source_workflow_name: "Test Created Workflow",
          flowgraph: {
            nodes: [
              {
                node_key: "source-node",
                type: "source",
                config: {},
              },
              {
                node_key: "import-node",
                type: "import",
                config: {},
              },
              {
                node_key: "help-text-node",
                type: "help-text",
                config: {},
              },
            ],
            edges: [
              {
                from_node_key: "source-node",
                to_node_key: "import-node",
              },
            ],
          },
        },
      },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.id === "number")
  })

  it("create_simple_workflow generates flowgraph and creates workflow", async () => {
    const result = await handleToolCall(
      client,
      "create_simple_workflow",
      {
        name: "Simple Test Workflow",
        template_key: "invoices",
      },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.id === "number")
  })

  it("create_simple_workflow respects is_template_required", async () => {
    const result = await handleToolCall(
      client,
      "create_simple_workflow",
      {
        name: "Optional Template Workflow",
        template_key: "invoices",
        is_template_required: false,
      },
    )
    assert.equal(result.isError, undefined)
  })

  it("duplicate_workflow duplicates a workflow", async () => {
    const result = await handleToolCall(
      client,
      "duplicate_workflow",
      { workflow_id: 1, name: "Duplicated" },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.id === "number")
  })

  it("update_workflow updates metadata", async () => {
    const result = await handleToolCall(
      client,
      "update_workflow",
      { workflow_id: 1, name: "Updated Name" },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.id === "number")
  })

  it("delete_workflow deletes a workflow", async () => {
    const result = await handleToolCall(
      client,
      "delete_workflow",
      { workflow_id: 1 },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(data.success === true)
  })

  it("get_template exports a template", async () => {
    const result = await handleToolCall(client, "get_template", {
      template_key: "invoices",
    })
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.name === "string")
    assert.ok(typeof data.template_key === "string")
    assert.ok(Array.isArray(data.columns))
  })

  it("create_template creates a template", async () => {
    const result = await handleToolCall(
      client,
      "create_template",
      {
        name: "Test Template",
        template_key: "test_template",
        columns: [
          { label: "Name", key: "name" },
          {
            label: "Email",
            key: "email",
            data_type: "EMAIL",
            is_required: true,
          },
        ],
      },
    )
    assert.equal(result.isError, undefined)
    const data = JSON.parse(
      (result.content[0] as { type: "text"; text: string }).text,
    )
    assert.ok(typeof data.id === "number")
  })

  it("unknown tool returns an error", async () => {
    const result = await handleToolCall(
      client,
      "nonexistent_tool",
      {},
    )
    assert.equal(result.isError, true)
    const text = (
      result.content[0] as { type: "text"; text: string }
    ).text
    assert.ok(text.includes("Unknown tool"))
  })
})
