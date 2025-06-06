import { Context } from 'hono'

/**
 * 获取代理目标 URL
 */
function getProxyUrl(c: Context): string | null {
  return c.req.query('url') || null
}

/**
 * 获取是否启用 HTML 重写
 */
function getRewriteFlag(c: Context): boolean {
  return c.req.query('rewrite') === '1' || c.req.query('rewrite') === 'true'
}

/**
 * 确保 URL 带有 http/https 协议
 */
function ensureHttpProtocol(url: string, defaultProtocol: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${defaultProtocol}://${url}`
}

/**
 * 过滤请求头
 */
function filterHeaders(headers: Headers, filterFunc: (name: string) => boolean): Headers {
  return new Headers([...headers].filter(([name]) => filterFunc(name)))
}

/**
 * 设置禁用缓存的头部
 */
function setNoCacheHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store')
}

/**
 * 设置 CORS 头部
 */
function setCorsHeaders(headers: Headers) {
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  headers.set('Access-Control-Allow-Headers', '*')
}

/**
 * 处理重定向响应
 */
function handleRedirectResponse(resp: Response, headers: Headers) {
  if (resp.status >= 300 && resp.status < 400 && resp.headers.get('location')) {
    return new Response(null, { status: resp.status, headers })
  }
  return null
}

/**
 * 判断是否为 HTML 响应
 */
function isHtmlResponse(resp: Response): boolean {
  const contentType = resp.headers.get('content-type') || ''
  return contentType.includes('text/html')
}

/**
 * 重写 HTML 中的资源链接为代理地址
 */
async function rewriteHtmlBody(body: ReadableStream<Uint8Array> | null, baseUrl: string, rewrite: boolean): Promise<string> {
  if (!body) return ''
  const text = await new Response(body).text()
  const rewriteParam = rewrite ? '&rewrite=1' : ''
  return text.replace(
    /(src|href)=["']([^"']+)["']/g,
    (match, attr, value) => {
      // console.log('match', match, attr, value)
      if (/^https?:\/\//.test(value)) return match
      if (value.startsWith('//')) {
        return `${attr}="/proxy?url=https:${value}${rewriteParam}"`
      }
      if (value.startsWith('/')) {
        const url = new URL(baseUrl)
        return `${attr}="/proxy?url=${url.origin}${value}${rewriteParam}"`
      }
      const url = new URL(baseUrl)
      const absUrl = new URL(value, url).href
      return `${attr}="/proxy?url=${absUrl}${rewriteParam}"`
    }
  )
}

/**
 * 判断是否已编码
 */
function isProbablyEncoded(url: string): boolean {
  // 如果包含 %，大概率已经 encode 过
  return /%[0-9A-Fa-f]{2}/.test(url)
}

/**
 * 将请求中的额外查询参数合并到目标 URL 上（排除 url 和 rewrite 参数）
 *
 * @param c Hono Context 上下文对象
 * @param urlParam 需要合并参数的原始 URL 字符串
 * @param excludeKeys 需要排除的参数名数组，默认排除 'url' 和 'rewrite'
 * @returns 合并后的完整 URL 字符串
 */
function mergeExtraQueryToUrl(c: Context, urlParam: string, excludeKeys: string[] = ['url', 'rewrite']): string {
  const urlObj = new URL(urlParam, 'http://dummy-base') // base 只为解析用
  const searchParams = new URLSearchParams(urlObj.search)
  for (const [key, value] of Object.entries(c.req.query())) {
    if (!excludeKeys.includes(key) && value !== undefined) {
      searchParams.append(key, value)
    }
  }
  urlObj.search = searchParams.toString()
  return urlObj.href
}

/**
 * 代理主处理器
 */
export const handlerProxy = async (c: Context) => {
  let urlParam = getProxyUrl(c)

  if (!urlParam) return c.json({ error: '缺少 url 参数' }, 400)
  if (!isProbablyEncoded(urlParam)) urlParam = mergeExtraQueryToUrl(c, urlParam)

  const rewrite = getRewriteFlag(c)
  const targetUrl = ensureHttpProtocol(urlParam, 'https')
  // console.log('targetUrl', targetUrl)

  try {
    const filteredHeaders = filterHeaders(
      c.req.raw.headers,
      (name) => !name.toLowerCase().startsWith('cf-')
    )
    const resp = await fetch(targetUrl, {
      headers: filteredHeaders,
      redirect: 'manual',
    })

    const headers = new Headers(resp.headers)
    setNoCacheHeaders(headers)
    setCorsHeaders(headers)

    const redirectResp = handleRedirectResponse(resp, headers)
    if (redirectResp) return redirectResp

    if (rewrite && isHtmlResponse(resp)) {
      const rewritten = await rewriteHtmlBody(resp.body, targetUrl, rewrite)
      return new Response(rewritten, {
        status: resp.status,
        headers,
      })
    }

    return new Response(resp.body, {
      status: resp.status,
      headers,
    })
  } catch (e) {
    return c.json({ error: '代理请求失败', detail: String(e) }, 502)
  }
} 