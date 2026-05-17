import { useState } from 'react'
import Image from 'next/image'

export default function R2ImageUploader() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const res = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, expires: 900 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'presign failed')
      const { uploadUrl, publicUrl } = json

      // Upload via PUT to the signed URL
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('upload failed')

      setUploadedUrl(publicUrl)
    } catch (err) {
      console.error(err)
      alert(String(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Upload image to R2
        <input type="file" accept="image/*" onChange={handleChange} />
      </label>

      {uploading && <div>Uploading…</div>}

      {previewUrl && !uploadedUrl && (
        <div style={{ marginTop: 8 }}>
          <img
            src={previewUrl}
            alt="preview"
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      )}

      {uploadedUrl && (
        <div style={{ marginTop: 12 }}>
          <div style={{ maxWidth: 800 }}>
            <Image
              src={uploadedUrl}
              alt="uploaded"
              width={800}
              height={600}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
