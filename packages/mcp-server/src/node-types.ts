/**
 * Static reference data for all flowgraph node types.
 *
 * This is exposed as an MCP resource so AI assistants know the vocabulary
 * for constructing valid flowgraph DAGs.
 */

export interface NodeTypeInfo {
  type: string
  label: string
  description: string
  is_default: boolean
  singleton: boolean
  requires_pipeline: boolean
  input_type: string | null
  runner_keys: string[]
}

export const NODE_TYPES: NodeTypeInfo[] = [
  // Default nodes
  {
    type: "source",
    label: "Source files",
    description:
      "Entry point for the workflow. Uploaded files arrive at this node.",
    is_default: true,
    singleton: true,
    requires_pipeline: false,
    input_type: null,
    runner_keys: [],
  },
  {
    type: "import",
    label: "Import files",
    description:
      "Terminal node that finalizes the import. Maps templates to processed data.",
    is_default: true,
    singleton: true,
    requires_pipeline: false,
    input_type: "lists",
    runner_keys: ["template_mapping"],
  },
  {
    type: "help-text",
    label: "Help text",
    description:
      "Default informational node. Does not process data.",
    is_default: true,
    singleton: true,
    requires_pipeline: false,
    input_type: null,
    runner_keys: [],
  },
  {
    type: "post-import-file-action",
    label: "Post import file action",
    description:
      "Runs a workflow code action after import completes. References a workflow_code_action_key.",
    is_default: false,
    singleton: true,
    requires_pipeline: false,
    input_type: "lists",
    runner_keys: ["workflow_code_action_key"],
  },
  // List-processing nodes
  {
    type: "single-list",
    label: "Sheet transforms",
    description:
      "Applies column mapping, validation, and transforms to a single sheet. Requires a pipeline with a template_key.",
    is_default: false,
    singleton: false,
    requires_pipeline: true,
    input_type: "lists",
    runner_keys: ["template_key"],
  },
  {
    type: "split-list",
    label: "Split sheet by row count",
    description:
      "Splits a sheet into multiple sheets with a maximum number of rows each.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "lists",
    runner_keys: ["max_rows_per_file"],
  },
  {
    type: "merge-rows",
    label: "Combine sheets by row",
    description:
      "Combines multiple sheets into a single sheet by appending rows.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "lists",
    runner_keys: ["output_file_name"],
  },
  {
    type: "join-lists",
    label: "Join sheets by column",
    description:
      "Joins two sheets by matching column values (like a SQL JOIN).",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "lists",
    runner_keys: [
      "left_key_column",
      "right_key_column",
      "right_list_prefix",
      "output_file_name",
    ],
  },
  {
    type: "ai-classify-values",
    label: "Categorize data",
    description:
      "Uses AI to classify/categorize values in a column based on training data.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "lists",
    runner_keys: [
      "input_column_name",
      "output_column_name",
      "training_input_column_name",
      "training_output_column_name",
      "enums_column_name",
    ],
  },
  // File-processing nodes
  {
    type: "excel-extract",
    label: "Extract Excel worksheets",
    description:
      "Splits an Excel file into individual sheet CSVs. Can target specific sheets or all sheets.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: ["sheet_names", "all_sheets"],
  },
  {
    type: "pdf-extract",
    label: "Extract PDF data",
    description:
      "Extracts structured data from PDF files using an AI provider (OpenAI or Gemini).",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: [
      "provider_type",
      "output_replica_count",
      "consistency_threshold",
      "user_prompt",
      "column_definitions",
    ],
  },
  {
    type: "pdf-split",
    label: "Split PDF by page",
    description: "Splits a multi-page PDF into individual page PDFs.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: [],
  },
  {
    type: "unzip-extract",
    label: "Unzip file",
    description: "Extracts files from a ZIP archive.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: [],
  },
  {
    type: "fixed-width-parse",
    label: "Convert fixed-width file",
    description:
      "Parses a fixed-width text file into columnar data.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: [],
  },
  {
    type: "decrypt-file",
    label: "Decrypt file",
    description: "Decrypts an encrypted file.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: [],
  },
  {
    type: "convert-to-pdf",
    label: "Convert to PDF",
    description: "Converts a file to PDF format.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "files",
    runner_keys: [],
  },
  // Any-processing nodes
  {
    type: "custom-file-action",
    label: "Custom file transform",
    description:
      "Runs custom JavaScript code to transform files. Config includes a 'code' field.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "any",
    runner_keys: ["code"],
  },
  {
    type: "csv-agent",
    label: "CSV transforms with AI",
    description:
      "Uses an AI agent to transform CSV data. Config includes 'code' and 'template_key'.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "any",
    runner_keys: ["code", "template_key"],
  },
  {
    type: "file-agent",
    label: "File transforms agent",
    description:
      "Uses an AI agent to transform files. Config includes a 'code' field.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "any",
    runner_keys: ["code"],
  },
  {
    type: "call-workflow",
    label: "Call Multi FileFeed",
    description:
      "Calls another workflow as a sub-workflow. Config references a workflow_name.",
    is_default: false,
    singleton: false,
    requires_pipeline: false,
    input_type: "any",
    runner_keys: ["workflow_name"],
  },
]
