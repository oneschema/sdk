/**
 * Integration tests for the MCP server protocol layer.
 *
 * Tests resource listing/reading and prompt listing/getting by
 * connecting a Client to the Server via in-memory transports.
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import http from "node:http"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { OneSchemaClient } from "../api-client.js"
import { prompts } from "../prompts.js"
import {
  resourceTemplates,
  staticResources,
} from "../resources.js"
import { handleToolCall, toolDefinitions } from "../tools.js"

// -- Mock server for OneSchema API -------------------------------------------

function createMockApiServer(): http.Server {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")
    const pathname = url.pathname

    if (
      req.method === "GET" &&
      pathname === "/v0/multi-file-feeds"
    ) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify([
          { id: 1, name: "Workflow A", workspace_id: null },
        ]),
      )
      return
    }

    if (
      req.method === "GET" &&
      /^\/v0\/multi-file-feeds\/\d+$/.test(pathname)
    ) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          id: 1,
          name: "Workflow A",
          workspace_id: null,
          custom_metadata: {},
          templates: [],
          source: [],
          destination: [],
          event_webhooks: [],
          post_validation_transform_key: null,
        }),
      )
      return
    }

    if (
      req.method === "GET" &&
      /^\/v0\/multi-file-feeds\/\d+\/flowgraph$/.test(pathname)
    ) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          version: 0,
          exported_at: "2025-01-01T00:00:00Z",
          source_workflow_name: "Workflow A",
          flowgraph: {
            nodes: [
              {
                node_key: "src",
                type: "source",
                config: {},
              },
            ],
            edges: [],
          },
        }),
      )
      return
    }

    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Not found" }))
  })
}

// -- Helper to match URI templates -------------------------------------------

function matchUriTemplate(
  template: string,
  uri: string,
): Record<string, string> | null {
  const paramNames: string[] = []
  const regexStr = template.replace(
    /\{([^}]+)\}/g,
    (_match, paramName: string) => {
      paramNames.push(paramName)
      return "([^/]+)"
    },
  )
  const match = new RegExp(`^${regexStr}$`).exec(uri)
  if (!match) return null
  const params: Record<string, string> = {}
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1]
  })
  return params
}

// -- Test suite --------------------------------------------------------------

describe("MCP server protocol", () => {
  let mcpClient: Client
  let mcpServer: Server
  let apiClient: OneSchemaClient
  let mockApiServer: http.Server

  before(async () => {
    // Start mock API server
    mockApiServer = createMockApiServer()
    await new Promise<void>((resolve) => {
      mockApiServer.listen(0, "127.0.0.1", () => resolve())
    })
    const addr = mockApiServer.address()
    let baseUrl = "http://127.0.0.1"
    if (typeof addr === "object" && addr !== null) {
      baseUrl = `http://127.0.0.1:${addr.port}`
    }
    apiClient = new OneSchemaClient({
      baseUrl,
      apiKey: "test-key",
    })

    // Create MCP server with handlers
    mcpServer = new Server(
      { name: "oneschema-test", version: "0.1.0" },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    )

    // Register handlers (same as index.ts)
    mcpServer.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: toolDefinitions,
      }),
    )

    mcpServer.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params
        return handleToolCall(apiClient, name, args ?? {})
      },
    )

    mcpServer.setRequestHandler(
      ListResourcesRequestSchema,
      async () => ({
        resources: staticResources.map((r) => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        })),
      }),
    )

    mcpServer.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => ({
        resourceTemplates: resourceTemplates.map((t) => ({
          uriTemplate: t.uriTemplate,
          name: t.name,
          description: t.description,
          mimeType: t.mimeType,
        })),
      }),
    )

    mcpServer.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const uri = request.params.uri

        for (const resource of staticResources) {
          if (uri === resource.uri) {
            const text = await resource.handler(apiClient, {})
            return {
              contents: [
                {
                  uri: resource.uri,
                  mimeType: resource.mimeType,
                  text,
                },
              ],
            }
          }
        }

        for (const template of resourceTemplates) {
          const params = matchUriTemplate(
            template.uriTemplate,
            uri,
          )
          if (params) {
            const text = await template.handler(
              apiClient,
              params,
            )
            return {
              contents: [
                { uri, mimeType: template.mimeType, text },
              ],
            }
          }
        }

        throw new Error(`Resource not found: ${uri}`)
      },
    )

    mcpServer.setRequestHandler(
      ListPromptsRequestSchema,
      async () => ({
        prompts: prompts.map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        })),
      }),
    )

    mcpServer.setRequestHandler(
      GetPromptRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params
        const prompt = prompts.find((p) => p.name === name)
        if (!prompt) throw new Error(`Prompt not found: ${name}`)
        const stringArgs: Record<string, string> = {}
        if (args) {
          for (const [key, value] of Object.entries(args)) {
            if (value !== undefined)
              stringArgs[key] = String(value)
          }
        }
        return { messages: prompt.handler(stringArgs) }
      },
    )

    // Connect via in-memory transport
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair()

    mcpClient = new Client({
      name: "test-client",
      version: "1.0.0",
    })

    await Promise.all([
      mcpClient.connect(clientTransport),
      mcpServer.connect(serverTransport),
    ])
  })

  after(async () => {
    await mcpClient.close()
    await mcpServer.close()
    await new Promise<void>((resolve) => {
      mockApiServer.close(() => resolve())
    })
  })

  // -- Tools -----------------------------------------------------------------

  describe("tools", () => {
    it("lists all 10 tools", async () => {
      const result = await mcpClient.listTools()
      assert.equal(result.tools.length, 10)
      const names = result.tools.map((t) => t.name).sort()
      assert.deepEqual(names, [
        "create_simple_workflow",
        "create_template",
        "create_workflow_from_flowgraph",
        "delete_workflow",
        "duplicate_workflow",
        "export_flowgraph",
        "get_template",
        "get_workflow",
        "list_workflows",
        "update_workflow",
      ])
    })

    it("calls list_workflows via MCP protocol", async () => {
      const result = await mcpClient.callTool({
        name: "list_workflows",
        arguments: {},
      })
      assert.equal(result.isError, undefined)
      const content = result.content as { type: string; text: string }[]
      const data = JSON.parse(content[0].text)
      assert.ok(Array.isArray(data))
    })

    it("calls get_workflow via MCP protocol", async () => {
      const result = await mcpClient.callTool({
        name: "get_workflow",
        arguments: { workflow_id: 1 },
      })
      assert.equal(result.isError, undefined)
      const content = result.content as { type: string; text: string }[]
      const text = content[0].text
      const data = JSON.parse(text)
      assert.equal(data.id, 1)
    })
  })

  // -- Resources -------------------------------------------------------------

  describe("resources", () => {
    it("lists static resources", async () => {
      const result = await mcpClient.listResources()
      assert.ok(result.resources.length >= 2)
      const uris = result.resources.map((r) => r.uri)
      assert.ok(uris.includes("oneschema://node-types"))
      assert.ok(uris.includes("oneschema://workflows"))
    })

    it("lists resource templates", async () => {
      const result = await mcpClient.listResourceTemplates()
      assert.ok(result.resourceTemplates.length >= 2)
      const templates = result.resourceTemplates.map(
        (t) => t.uriTemplate,
      )
      assert.ok(
        templates.includes(
          "oneschema://workflows/{workflow_id}",
        ),
      )
      assert.ok(
        templates.includes(
          "oneschema://workflows/{workflow_id}/flowgraph",
        ),
      )
    })

    it("reads node-types resource", async () => {
      const result = await mcpClient.readResource({
        uri: "oneschema://node-types",
      })
      assert.ok(result.contents.length > 0)
      const entry = result.contents[0] as { uri: string; text: string; mimeType?: string }
      const data = JSON.parse(entry.text)
      assert.ok(Array.isArray(data))
      assert.ok(data.length === 20)
      assert.ok(
        data.some(
          (n: { type: string }) => n.type === "source",
        ),
      )
    })

    it("reads workflows resource", async () => {
      const result = await mcpClient.readResource({
        uri: "oneschema://workflows",
      })
      assert.ok(result.contents.length > 0)
      const entry = result.contents[0] as { uri: string; text: string; mimeType?: string }
      const data = JSON.parse(entry.text)
      assert.ok(Array.isArray(data))
    })

    it("reads a specific workflow resource", async () => {
      const result = await mcpClient.readResource({
        uri: "oneschema://workflows/1",
      })
      assert.ok(result.contents.length > 0)
      const entry = result.contents[0] as { uri: string; text: string; mimeType?: string }
      const data = JSON.parse(entry.text)
      assert.equal(data.id, 1)
    })

    it("reads a workflow flowgraph resource", async () => {
      const result = await mcpClient.readResource({
        uri: "oneschema://workflows/1/flowgraph",
      })
      assert.ok(result.contents.length > 0)
      const entry = result.contents[0] as { uri: string; text: string; mimeType?: string }
      const data = JSON.parse(entry.text)
      assert.equal(data.version, 0)
      assert.ok(data.flowgraph)
    })
  })

  // -- Prompts ---------------------------------------------------------------

  describe("prompts", () => {
    it("lists all prompts", async () => {
      const result = await mcpClient.listPrompts()
      assert.equal(result.prompts.length, 2)
      const names = result.prompts.map((p) => p.name).sort()
      assert.deepEqual(names, [
        "create_simple_workflow",
        "describe_workflow",
      ])
    })

    it("gets create_simple_workflow prompt", async () => {
      const result = await mcpClient.getPrompt({
        name: "create_simple_workflow",
        arguments: {
          workflow_name: "Invoice Processing",
          template_key: "invoices",
        },
      })
      assert.ok(result.messages.length > 0)
      const text = (
        result.messages[0].content as {
          type: "text"
          text: string
        }
      ).text
      assert.ok(text.includes("Invoice Processing"))
      assert.ok(text.includes("invoices"))
    })

    it("gets describe_workflow prompt", async () => {
      const result = await mcpClient.getPrompt({
        name: "describe_workflow",
        arguments: { workflow_id: "42" },
      })
      assert.ok(result.messages.length > 0)
      const text = (
        result.messages[0].content as {
          type: "text"
          text: string
        }
      ).text
      assert.ok(text.includes("42"))
    })
  })
})
