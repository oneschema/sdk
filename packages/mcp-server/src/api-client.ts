/**
 * HTTP client for the OneSchema external API.
 *
 * Wraps fetch calls with authentication, error handling, and JSON parsing.
 * All methods throw {@link OneSchemaApiError} on non-2xx responses.
 */

import type {
  FlowgraphExport,
  OneSchemaApiError,
  TemplateExport,
  Workflow,
  WorkflowSummary,
} from "./types.js"

export class OneSchemaClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(opts: { baseUrl: string; apiKey: string }) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "")
    this.apiKey = opts.apiKey
  }

  // -- Workflows -------------------------------------------------------------

  async listWorkflows(folderId?: number): Promise<WorkflowSummary[]> {
    const params = new URLSearchParams()
    if (folderId !== undefined) {
      params.set("folder_id", String(folderId))
    }
    const qs = params.toString()
    const url = `/v0/multi-file-feeds${qs ? `?${qs}` : ""}`
    return this.get<WorkflowSummary[]>(url)
  }

  async getWorkflow(workflowId: number): Promise<Workflow> {
    return this.get<Workflow>(`/v0/multi-file-feeds/${workflowId}`)
  }

  async duplicateWorkflow(
    workflowId: number,
    name: string,
  ): Promise<Workflow> {
    return this.post<Workflow>(
      `/v0/multi-file-feeds/${workflowId}/duplicate`,
      { name },
    )
  }

  async updateWorkflow(
    workflowId: number,
    updates: {
      name?: string
      folder_id?: number
      source?: Record<string, unknown> | null
      destination?: Record<string, unknown> | null
    },
  ): Promise<Workflow> {
    return this.patch<Workflow>(
      `/v0/multi-file-feeds/${workflowId}`,
      updates,
    )
  }

  async deleteWorkflow(
    workflowId: number,
  ): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(
      `/v0/multi-file-feeds/${workflowId}`,
    )
  }

  // -- Flowgraphs ------------------------------------------------------------

  async exportFlowgraph(workflowId: number): Promise<FlowgraphExport> {
    return this.get<FlowgraphExport>(
      `/v0/multi-file-feeds/${workflowId}/flowgraph`,
    )
  }

  async createWorkflowFromFlowgraph(params: {
    name: string
    folder_id?: number
    flowgraph: FlowgraphExport
  }): Promise<Workflow> {
    const body: Record<string, unknown> = {
      name: params.name,
      ...params.flowgraph,
    }
    if (params.folder_id !== undefined) {
      body.folder_id = params.folder_id
    }
    return this.post<Workflow>(
      "/v0/multi-file-feeds/import-from-json",
      body,
    )
  }

  // -- Templates -------------------------------------------------------------

  async getTemplate(templateKey: string): Promise<TemplateExport> {
    return this.get<TemplateExport>(
      `/templates/export/${encodeURIComponent(templateKey)}`,
    )
  }

  async createTemplate(
    template: TemplateExport,
  ): Promise<{ id: number }> {
    return this.post<{ id: number }>("/templates/import", template)
  }

  // -- HTTP helpers ----------------------------------------------------------

  private async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path)
  }

  private async post<T>(
    path: string,
    body: unknown,
  ): Promise<T> {
    return this.request<T>("POST", path, body)
  }

  private async patch<T>(
    path: string,
    body: unknown,
  ): Promise<T> {
    return this.request<T>("PATCH", path, body)
  }

  private async del<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      "X-Api-Key": this.apiKey,
      Accept: "application/json",
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json"
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      let details: unknown
      try {
        details = await res.json()
      } catch {
        details = await res.text().catch(() => undefined)
      }
      const err: OneSchemaApiError = {
        status: res.status,
        message: `OneSchema API error: ${res.status} ${res.statusText}`,
        details,
      }
      throw err
    }

    return (await res.json()) as T
  }
}
