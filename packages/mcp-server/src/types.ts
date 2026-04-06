/**
 * Type definitions for OneSchema API responses and flowgraph structures.
 */

// -- Workflow types ----------------------------------------------------------

export interface WorkflowSummary {
  id: number
  name: string
  workspace_id: number | null
}

export interface WorkflowTemplate {
  name: string
  description: string | null
  key: string
}

export interface WorkflowSftpTarget {
  type: string
  data: Record<string, unknown>
}

export interface WorkflowEventWebhook {
  url: string
  secret_key: string | null
}

export interface Workflow {
  id: number
  workspace_id: number | null
  name: string
  custom_metadata: Record<string, unknown>
  templates: WorkflowTemplate[]
  source: WorkflowSftpTarget[]
  destination: WorkflowSftpTarget[]
  event_webhooks: WorkflowEventWebhook[]
  post_validation_transform_key: string | null
}

// -- Flowgraph portable JSON types -------------------------------------------

export interface FlowgraphPromptGeneratedCodeAction {
  key: string
  label: string
  user_prompt: string
  code: string
}

export interface FlowgraphPipeline {
  template_key: string | null
  config: Record<string, unknown>
  prompt_generated_code_actions: FlowgraphPromptGeneratedCodeAction[]
}

export interface FlowgraphNode {
  node_key: string
  type: string
  config: Record<string, unknown>
  position_x?: number | null
  position_y?: number | null
  pipeline?: FlowgraphPipeline
}

export interface FlowgraphEdge {
  from_node_key: string
  to_node_key: string
}

export interface FlowgraphTemplateEntry {
  template_key: string
  is_required: boolean
}

export interface FlowgraphExport {
  version: number
  exported_at: string
  source_workflow_name: string
  templates?: FlowgraphTemplateEntry[]
  flowgraph: {
    nodes: FlowgraphNode[]
    edges: FlowgraphEdge[]
  }
}

// -- Template types ----------------------------------------------------------

export interface TemplateColumn {
  label: string
  key: string
  data_type?: string | null
  validation_options?: Record<string, unknown>
  is_required?: boolean
  is_unique?: boolean
  letter_case?: string
  min_char_limit?: number
  max_char_limit?: number
  delimiter?: string
  must_exist?: boolean
  is_custom?: boolean
  description?: string
  default_value?: string
  mapping_hints?: string[]
}

export interface TemplateExport {
  name: string
  template_key: string
  columns: TemplateColumn[]
  row_constraints?: Record<string, unknown>[]
  validation_hooks?: Record<string, unknown>[]
}

// -- API error ---------------------------------------------------------------

export interface OneSchemaApiError {
  status: number
  message: string
  details?: unknown
}
