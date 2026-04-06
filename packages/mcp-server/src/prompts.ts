/**
 * MCP prompt definitions for common OneSchema workflow tasks.
 */

import { NODE_TYPES } from "./node-types.js"

export interface PromptDefinition {
  name: string
  description: string
  arguments: {
    name: string
    description: string
    required: boolean
  }[]
  handler: (args: Record<string, string>) => {
    role: "user"
    content: { type: "text"; text: string }
  }[]
}

export const prompts: PromptDefinition[] = [
  // -- create_simple_workflow ------------------------------------------------
  {
    name: "create_simple_workflow",
    description:
      "Guide for creating a basic Multi FileFeed with a source -> sheet transforms -> import pipeline. Returns a prompt that helps you construct the right tool calls.",
    arguments: [
      {
        name: "workflow_name",
        description: "The name for the new workflow",
        required: true,
      },
      {
        name: "template_key",
        description:
          "The template key to use for the sheet transforms step",
        required: true,
      },
    ],
    handler: (args) => {
      const workflowName = args.workflow_name ?? "My Workflow"
      const templateKey = args.template_key ?? "my_template"
      return [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Create a Multi FileFeed named "${workflowName}" with the following structure:

1. A **source** node where files are uploaded
2. A **single-list** (sheet transforms) node that processes data using the template "${templateKey}"
3. An **import** node that finalizes the processed data

This is the most common workflow pattern. You can use the \`create_simple_workflow\` tool with:
- name: "${workflowName}"
- template_key: "${templateKey}"

Or for more control, use \`create_workflow_from_flowgraph\` with a full flowgraph payload. Remember to include the three default nodes (source, import, help-text) in any flowgraph.`,
          },
        },
      ]
    },
  },

  // -- describe_workflow -----------------------------------------------------
  {
    name: "describe_workflow",
    description:
      "Export a workflow's flowgraph and describe its structure in plain English. Helps understand what an existing workflow does before modifying or duplicating it.",
    arguments: [
      {
        name: "workflow_id",
        description: "The Multi FileFeed ID to describe",
        required: true,
      },
    ],
    handler: (args) => {
      const workflowId = args.workflow_id ?? "1"

      const nodeTypeSummary = NODE_TYPES.map(
        (n) => `- **${n.type}**: ${n.description}`,
      ).join("\n")

      return [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Please describe the structure of workflow ${workflowId}. Follow these steps:

1. Use \`export_flowgraph\` with workflow_id: ${workflowId} to get the flowgraph JSON
2. Analyze the nodes and edges to understand the data flow
3. Describe the workflow in plain English, explaining:
   - What files it expects as input
   - What processing steps are applied (and in what order)
   - What templates are used for validation/mapping
   - What the final output looks like

Here are the available node types for reference:
${nodeTypeSummary}`,
          },
        },
      ]
    },
  },
]
