/**
 * MCP tool definitions for OneSchema workflow and flowgraph operations.
 *
 * Uses plain JSON Schema tool descriptors and a dispatch function to avoid
 * TypeScript deep type instantiation issues with McpServer's generic
 * Zod-based tool() method.
 */

import type { OneSchemaClient } from "./api-client.js"
import type {
  CallToolResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js"
import type { FlowgraphExport, OneSchemaApiError } from "./types.js"

// -- Helpers ----------------------------------------------------------------

function ok(result: unknown): CallToolResult {
  return {
    content: [
      { type: "text", text: JSON.stringify(result, null, 2) },
    ],
  }
}

function apiError(err: unknown): CallToolResult {
  const apiErr = err as OneSchemaApiError
  if (apiErr.status) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: apiErr.message,
              status: apiErr.status,
              details: apiErr.details,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    }
  }
  throw err
}

// -- Tool descriptors (JSON Schema, no Zod) ---------------------------------

const FLOWGRAPH_NODE_TYPES = [
  "source",
  "import",
  "help-text",
  "post-import-file-action",
  "single-list",
  "split-list",
  "merge-rows",
  "join-lists",
  "ai-classify-values",
  "excel-extract",
  "pdf-extract",
  "pdf-split",
  "unzip-extract",
  "fixed-width-parse",
  "decrypt-file",
  "custom-file-action",
  "csv-agent",
  "file-agent",
  "convert-to-pdf",
  "call-workflow",
]

export const toolDefinitions: Tool[] = [
  {
    name: "list_workflows",
    description:
      "List all Multi FileFeeds (workflows) in the organization. Optionally filter by folder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        folder_id: {
          type: "number",
          description: "Filter workflows by folder ID",
        },
      },
    },
  },
  {
    name: "get_workflow",
    description:
      "Get full details of a Multi FileFeed (workflow) by its ID, including templates, source, destination, and event webhooks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflow_id: {
          type: "number",
          description: "The Multi FileFeed ID",
        },
      },
      required: ["workflow_id"],
    },
  },
  {
    name: "export_flowgraph",
    description:
      "Export the flowgraph (DAG of processing nodes and edges) for a Multi FileFeed as portable JSON. Use this to understand an existing workflow's structure before creating or modifying one.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflow_id: {
          type: "number",
          description: "The Multi FileFeed ID to export",
        },
      },
      required: ["workflow_id"],
    },
  },
  {
    name: "create_workflow_from_flowgraph",
    description:
      "Create a new Multi FileFeed by importing a portable flowgraph JSON definition. The payload format matches the output of export_flowgraph. Every flowgraph must include the three default nodes (source, import, help-text) plus any custom processing nodes connected by edges.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name for the new workflow",
        },
        folder_id: {
          type: "number",
          description: "Folder ID to place the workflow in",
        },
        flowgraph: {
          type: "object",
          description: "The portable flowgraph JSON payload",
          properties: {
            version: {
              type: "number",
              description: "Schema version (must be 0)",
            },
            source_workflow_name: {
              type: "string",
              description:
                "Name of the source workflow this was derived from",
            },
            templates: {
              type: "array",
              description: "Top-level template declarations",
              items: {
                type: "object",
                properties: {
                  template_key: { type: "string" },
                  is_required: { type: "boolean" },
                },
                required: ["template_key", "is_required"],
              },
            },
            flowgraph: {
              type: "object",
              properties: {
                nodes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      node_key: { type: "string" },
                      type: {
                        type: "string",
                        enum: FLOWGRAPH_NODE_TYPES,
                      },
                      config: { type: "object" },
                      position_x: { type: "number" },
                      position_y: { type: "number" },
                      pipeline: { type: "object" },
                    },
                    required: ["node_key", "type", "config"],
                  },
                },
                edges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      from_node_key: { type: "string" },
                      to_node_key: { type: "string" },
                    },
                    required: ["from_node_key", "to_node_key"],
                  },
                },
              },
              required: ["nodes", "edges"],
            },
          },
          required: [
            "version",
            "source_workflow_name",
            "flowgraph",
          ],
        },
      },
      required: ["name", "flowgraph"],
    },
  },
  {
    name: "create_simple_workflow",
    description:
      "Create a simple Multi FileFeed with a basic source -> single-list (sheet transforms) -> import pipeline. This is a convenience tool that generates the flowgraph JSON automatically from a template key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name for the new workflow",
        },
        template_key: {
          type: "string",
          description:
            "Template key for the sheet transforms step",
        },
        is_template_required: {
          type: "boolean",
          description:
            "Whether the template is required (default: true)",
        },
        folder_id: {
          type: "number",
          description: "Folder ID to place the workflow in",
        },
      },
      required: ["name", "template_key"],
    },
  },
  {
    name: "duplicate_workflow",
    description:
      "Duplicate an existing Multi FileFeed with a new name. The new workflow is a full copy including its flowgraph and pipeline configuration.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflow_id: {
          type: "number",
          description: "The Multi FileFeed ID to duplicate",
        },
        name: {
          type: "string",
          description: "Name for the duplicated workflow",
        },
      },
      required: ["workflow_id", "name"],
    },
  },
  {
    name: "update_workflow",
    description:
      "Update a Multi FileFeed's metadata: name, folder, source (SFTP), or destination (SFTP).",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflow_id: {
          type: "number",
          description: "The Multi FileFeed ID to update",
        },
        name: { type: "string", description: "New name" },
        folder_id: {
          type: "number",
          description: "Move to this folder ID",
        },
        source: {
          type: "object",
          description: "SFTP source config, or null to remove",
        },
        destination: {
          type: "object",
          description:
            "SFTP destination config, or null to remove",
        },
      },
      required: ["workflow_id"],
    },
  },
  {
    name: "delete_workflow",
    description:
      "Permanently delete a Multi FileFeed and all its associated data.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflow_id: {
          type: "number",
          description: "The Multi FileFeed ID to delete",
        },
      },
      required: ["workflow_id"],
    },
  },
  {
    name: "get_template",
    description:
      "Export a template by its key. Returns the full template definition including columns, validation rules, and hooks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        template_key: {
          type: "string",
          description: "The template key to export",
        },
      },
      required: ["template_key"],
    },
  },
  {
    name: "create_template",
    description:
      "Create a new template. Templates define the expected schema (columns, data types, validation) for data imported through a workflow.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Display name for the template",
        },
        template_key: {
          type: "string",
          description:
            "Unique key identifier (e.g. 'invoices', 'customer_orders')",
        },
        columns: {
          type: "array",
          description: "Column definitions for the template",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                description: "Column display label",
              },
              key: {
                type: "string",
                description: "Column key identifier",
              },
              data_type: {
                type: "string",
                description:
                  "Validation data type (e.g. EMAIL, NUMBER, DATE)",
              },
              is_required: {
                type: "boolean",
                description: "Whether this column is required",
              },
              is_unique: {
                type: "boolean",
                description: "Whether values must be unique",
              },
              description: {
                type: "string",
                description: "Column description",
              },
            },
            required: ["label", "key"],
          },
        },
      },
      required: ["name", "template_key", "columns"],
    },
  },
]

// -- Tool handler dispatch --------------------------------------------------

type ToolArgs = Record<string, unknown>

export async function handleToolCall(
  client: OneSchemaClient,
  name: string,
  args: ToolArgs,
): Promise<CallToolResult> {
  try {
    switch (name) {
      case "list_workflows":
        return ok(
          await client.listWorkflows(
            args.folder_id as number | undefined,
          ),
        )

      case "get_workflow":
        return ok(
          await client.getWorkflow(args.workflow_id as number),
        )

      case "export_flowgraph":
        return ok(
          await client.exportFlowgraph(
            args.workflow_id as number,
          ),
        )

      case "create_workflow_from_flowgraph":
        return ok(
          await client.createWorkflowFromFlowgraph({
            name: args.name as string,
            folder_id: args.folder_id as number | undefined,
            flowgraph:
              args.flowgraph as unknown as FlowgraphExport,
          }),
        )

      case "create_simple_workflow": {
        const templateKey = args.template_key as string
        const isRequired =
          (args.is_template_required as boolean | undefined) ??
          true
        const workflowName = args.name as string

        const flowgraph: FlowgraphExport = {
          version: 0,
          exported_at: new Date().toISOString(),
          source_workflow_name: workflowName,
          templates: [
            {
              template_key: templateKey,
              is_required: isRequired,
            },
          ],
          flowgraph: {
            nodes: [
              {
                node_key: "source-node",
                type: "source",
                config: {},
                position_x: 0,
                position_y: 100,
              },
              {
                node_key: "transform-node",
                type: "single-list",
                config: {
                  runner: { template_key: templateKey },
                },
                position_x: 250,
                position_y: 100,
                pipeline: {
                  template_key: templateKey,
                  config: {},
                  prompt_generated_code_actions: [],
                },
              },
              {
                node_key: "import-node",
                type: "import",
                config: {},
                position_x: 500,
                position_y: 100,
              },
              {
                node_key: "help-text-node",
                type: "help-text",
                config: {},
                position_x: 0,
                position_y: 0,
              },
            ],
            edges: [
              {
                from_node_key: "source-node",
                to_node_key: "transform-node",
              },
              {
                from_node_key: "transform-node",
                to_node_key: "import-node",
              },
            ],
          },
        }

        return ok(
          await client.createWorkflowFromFlowgraph({
            name: workflowName,
            folder_id: args.folder_id as number | undefined,
            flowgraph,
          }),
        )
      }

      case "duplicate_workflow":
        return ok(
          await client.duplicateWorkflow(
            args.workflow_id as number,
            args.name as string,
          ),
        )

      case "update_workflow": {
        const updates: Record<string, unknown> = {}
        if (args.name !== undefined) updates.name = args.name
        if (args.folder_id !== undefined)
          updates.folder_id = args.folder_id
        if (args.source !== undefined)
          updates.source = args.source
        if (args.destination !== undefined)
          updates.destination = args.destination
        return ok(
          await client.updateWorkflow(
            args.workflow_id as number,
            updates as Parameters<
              typeof client.updateWorkflow
            >[1],
          ),
        )
      }

      case "delete_workflow":
        return ok(
          await client.deleteWorkflow(
            args.workflow_id as number,
          ),
        )

      case "get_template":
        return ok(
          await client.getTemplate(
            args.template_key as string,
          ),
        )

      case "create_template":
        return ok(
          await client.createTemplate({
            name: args.name as string,
            template_key: args.template_key as string,
            columns: args.columns as {
              label: string
              key: string
              data_type?: string
              is_required?: boolean
              is_unique?: boolean
              description?: string
            }[],
          }),
        )

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        }
    }
  } catch (err) {
    return apiError(err)
  }
}
