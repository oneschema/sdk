/**
 * MCP resource definitions for OneSchema data.
 *
 * Resources are read-only data endpoints that AI assistants can browse.
 */

import type { OneSchemaClient } from "./api-client.js"
import { NODE_TYPES } from "./node-types.js"

export interface ResourceDefinition {
  uri: string
  name: string
  description: string
  mimeType: string
  handler: (
    client: OneSchemaClient,
    params: Record<string, string>,
  ) => Promise<string>
}

export interface ResourceTemplateDefinition {
  uriTemplate: string
  name: string
  description: string
  mimeType: string
  handler: (
    client: OneSchemaClient,
    params: Record<string, string>,
  ) => Promise<string>
}

// -- Static resources --------------------------------------------------------

export const staticResources: ResourceDefinition[] = [
  {
    uri: "oneschema://node-types",
    name: "Flowgraph Node Types Reference",
    description:
      "Complete reference of all available flowgraph node types, including descriptions, input types, and configuration keys. Use this to understand what nodes you can include when building a flowgraph.",
    mimeType: "application/json",
    handler: async () => {
      return JSON.stringify(NODE_TYPES, null, 2)
    },
  },
  {
    uri: "oneschema://workflows",
    name: "All Workflows",
    description:
      "List of all Multi FileFeeds (workflows) in the organization.",
    mimeType: "application/json",
    handler: async (client) => {
      const workflows = await client.listWorkflows()
      return JSON.stringify(workflows, null, 2)
    },
  },
]

// -- Dynamic resource templates ----------------------------------------------

export const resourceTemplates: ResourceTemplateDefinition[] = [
  {
    uriTemplate: "oneschema://workflows/{workflow_id}",
    name: "Workflow Details",
    description:
      "Full details of a specific Multi FileFeed including templates, source, destination, and event webhooks.",
    mimeType: "application/json",
    handler: async (client, params) => {
      const workflowId = parseInt(params.workflow_id, 10)
      const workflow = await client.getWorkflow(workflowId)
      return JSON.stringify(workflow, null, 2)
    },
  },
  {
    uriTemplate: "oneschema://workflows/{workflow_id}/flowgraph",
    name: "Workflow Flowgraph",
    description:
      "The portable flowgraph JSON for a specific workflow, showing all nodes and edges in the processing DAG.",
    mimeType: "application/json",
    handler: async (client, params) => {
      const workflowId = parseInt(params.workflow_id, 10)
      const flowgraph = await client.exportFlowgraph(workflowId)
      return JSON.stringify(flowgraph, null, 2)
    },
  },
]
