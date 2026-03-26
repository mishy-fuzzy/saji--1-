export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  retries?: number
}

function isJsonContentType(value: string | null): boolean {
  return !!value && value.toLowerCase().includes("application/json")
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (!base) {
    return path
  }

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { retries = 0, headers, body, ...rest } = options
  const url = buildUrl(path)

  const requestHeaders = new Headers(headers || {})
  if (!requestHeaders.has("Content-Type") && body !== undefined) {
    requestHeaders.set("Content-Type", "application/json")
  }

  const makeRequest = async (): Promise<T> => {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      credentials: "include",
    })

    const isJson = isJsonContentType(response.headers.get("content-type"))
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const message = typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}`

      const code = typeof payload === "object" && payload && "code" in payload
        ? String((payload as { code: unknown }).code)
        : undefined

      throw new ApiError(message, response.status, code)
    }

    return payload as T
  }

  let attempt = 0
  for (;;) {
    try {
      return await makeRequest()
    } catch (error) {
      if (attempt >= retries) {
        throw error
      }
      attempt += 1
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
    }
  }
}
