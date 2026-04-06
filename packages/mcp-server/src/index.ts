#!/usr/bin/env node

/**
 * OneSchema MCP Server
 *
 * Exposes OneSchema Multi FileFeed (workflow) and flowgraph management
 * as MCP tools, resources, and prompts for AI assistants.
 *
 * Configuration via environment variables:
 *   ONESCHEMA_API_KEY  — Required. Your OneSchema API key.
 *   ONESCHEMA_API_URL  — Optional. Defaults to https://api.oneschema.co
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { OneSchemaClient } from "./api-client.js"
import { prompts } from "./prompts.js"
import {
  resourceTemplates,
  staticResources,
} from "./resources.js"
import { handleToolCall, toolDefinitions } from "./tools.js"

// -- Configuration -----------------------------------------------------------

const API_KEY = process.env.ONESCHEMA_API_KEY
const API_URL =
  process.env.ONESCHEMA_API_URL ?? "https://api.oneschema.co"

if (!API_KEY) {
  console.error(
    "Error: ONESCHEMA_API_KEY environment variable is required.",
  )
  process.exit(1)
}

// -- Initialize client and server --------------------------------------------

const client = new OneSchemaClient({
  baseUrl: API_URL,
  apiKey: API_KEY,
})

const server = new Server(
  { name: "oneschema", version: "0.1.0" },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
)

// -- Tools -------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}))

server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    const { name, arguments: args } = request.params
    return handleToolCall(client, name, args ?? {})
  },
)

// -- Resources ---------------------------------------------------------------

server.setRequestHandler(
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

server.setRequestHandler(
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

server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request) => {
    const uri = request.params.uri

    // Check static resources first
    for (const resource of staticResources) {
      if (uri === resource.uri) {
        const text = await resource.handler(client, {})
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

    // Check resource templates
    for (const template of resourceTemplates) {
      const params = matchUriTemplate(
        template.uriTemplate,
        uri,
      )
      if (params) {
        const text = await template.handler(client, params)
        return {
          contents: [
            {
              uri,
              mimeType: template.mimeType,
              text,
            },
          ],
        }
      }
    }

    throw new Error(`Resource not found: ${uri}`)
  },
)

// -- Prompts -----------------------------------------------------------------

server.setRequestHandler(
  ListPromptsRequestSchema,
  async () => ({
    prompts: prompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  }),
)

server.setRequestHandler(
  GetPromptRequestSchema,
  async (request) => {
    const { name, arguments: args } = request.params
    const prompt = prompts.find((p) => p.name === name)
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`)
    }
    const stringArgs: Record<string, string> = {}
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined) {
          stringArgs[key] = String(value)
        }
      }
    }
    return { messages: prompt.handler(stringArgs) }
  },
)

// -- URI template matching helper --------------------------------------------

/**
 * Matches a URI against a simple URI template with {param} placeholders.
 * Returns extracted params or null if no match.
 */
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

// -- Start server ------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("OneSchema MCP server running on stdio")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
