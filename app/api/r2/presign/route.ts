import { NextResponse } from 'next/server'

type PresignRequest = {
  filename: string
  contentType: string
  expires?: number
}

function getR2Endpoint() {
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT.replace(/\/$/, '')
  if (process.env.R2_ACCOUNT_ID) return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  return undefined
}

function generatePublicUrl(bucket: string, key: string, endpoint?: string) {
  const publicHostEnv = (process.env.R2_PUBLIC_HOSTNAME || process.env.R2_PUBLIC_URL || '').trim()
  if (publicHostEnv) {
    let base = publicHostEnv.replace(/\/$/, '')
    if (!/^https?:\/\//i.test(base)) base = `https://${base}`

    // Helper: encode each path segment instead of the full key so '/' remain separators.
    const encodeKeySegments = (k: string) => k.split('/').map(encodeURIComponent).join('/')

    // If the host contains a {bucket} placeholder, replace it and append the key
    if (base.includes('{bucket}')) {
      return `${base.replace('{bucket}', bucket).replace(/\/$/, '')}/${encodeKeySegments(key)}`
    }

    try {
      const url = new URL(base)
      const path = url.pathname.replace(/\/$/, '')

      if (!path || path === '/') {
        url.pathname = `/${bucket}/${encodeKeySegments(key)}`
      } else {
        const parts = path.split('/').filter(Boolean)
        if (parts[parts.length - 1] === bucket) {
          url.pathname = `${path}/${encodeKeySegments(key)}`
        } else {
          url.pathname = `${path}/${bucket}/${encodeKeySegments(key)}`
        }
      }

      return url.toString()
    } catch (err) {
      // Fallback to simple join if URL parsing fails
      return `${base}/${bucket}/${encodeKeySegments(key)}`
    }
  }

  if (endpoint) {
    const encodeKeySegments = (k: string) => k.split('/').map(encodeURIComponent).join('/')
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${encodeKeySegments(key)}`
  }

  const encodeKeySegments = (k: string) => k.split('/').map(encodeURIComponent).join('/')
  return `/${bucket}/${encodeKeySegments(key)}`
}

export async function POST(request: Request) {
  let body: PresignRequest
  try {
    body = await request.json()
  } catch (err) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { filename, contentType, expires = 900 } = body || {}
  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename_and_contentType_required' }, { status: 400 })
  }

  // Lazy import AWS SDK so handler fails gracefully if packages aren't installed
  let S3Client: any
  let PutObjectCommand: any
  let GetObjectCommand: any
  let getSignedUrl: any
  try {
    ;({ S3Client, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3'))
    ;({ getSignedUrl } = await import('@aws-sdk/s3-request-presigner'))
  } catch (err) {
    console.error('Missing AWS SDK packages', err)
    return NextResponse.json(
      {
        error: 'missing_sdk',
        message: 'Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner (pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner)'
      },
      { status: 500 }
    )
  }

  const bucket = process.env.R2_BUCKET
  if (!bucket) {
    return NextResponse.json({ error: 'R2_BUCKET_not_set' }, { status: 500 })
  }

  const endpoint = getR2Endpoint()
  const region = process.env.R2_REGION || 'auto'
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: 'R2_credentials_not_set' }, { status: 500 })
  }

  const s3 = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  })

  // Create a safe object key
  const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const putCmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  try {
    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: Number(expires) })

    // Construct a public URL. Prefer `R2_PUBLIC_HOSTNAME` (can be a full URL, domain,
    // or include a `{bucket}` placeholder). Fallback to the R2 endpoint + bucket.
    const publicUrl = generatePublicUrl(bucket, key, endpoint)

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (err: any) {
    console.error('presign_error', err)
    return NextResponse.json({ error: 'presign_failed', message: String(err?.message || err) }, { status: 500 })
  }
}
