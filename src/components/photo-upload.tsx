"use client"
import { useState } from "react"
import { Camera, Loader2, X, Star } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

interface Photo {
  id: string
  url: string
  isPrimary: boolean
}

interface PhotoUploadProps {
  animalId: string
  initialPhotos: Photo[]
}

export function PhotoUpload({ animalId, initialPhotos }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // reset so the same file can be re-selected
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported")
      return
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 4 MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      const body = new FormData()
      body.append("file", file)

      const r = await fetch(`/api/animals/${animalId}/photos`, {
        method: "POST",
        body,
      })

      const data = await r.json()

      if (!r.ok) {
        setError(data.error || "Upload failed — please try again")
        return
      }

      setPhotos(prev => [...prev, data as Photo])
    } catch {
      setError("Upload failed — please check your connection and try again")
    } finally {
      setUploading(false)
    }
  }

  async function removePhoto(photoId: string) {
    setRemoving(photoId)
    setError("")
    try {
      const r = await fetch(`/api/animals/${animalId}/photos/${photoId}`, { method: "DELETE" })
      if (r.ok) {
        setPhotos(prev => {
          const removed = prev.find(p => p.id === photoId)
          const updated = prev.filter(p => p.id !== photoId)
          // Promote next photo to primary in local state
          if (removed?.isPrimary && updated.length > 0) {
            updated[0] = { ...updated[0], isPrimary: true }
          }
          return updated
        })
      } else {
        const data = await r.json().catch(() => ({})) as any
        setError(data.error || "Failed to remove photo")
      }
    } catch {
      setError("Failed to remove photo — please try again")
    } finally {
      setRemoving(null)
    }
  }

  async function setAsPrimary(photoId: string) {
    setError("")
    try {
      const r = await fetch(`/api/animals/${animalId}/photos/${photoId}`, { method: "PATCH" })
      if (r.ok) {
        setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })))
      } else {
        const data = await r.json().catch(() => ({})) as any
        setError(data.error || "Failed to update photo")
      }
    } catch {
      setError("Failed to update photo")
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {photos.map(photo => (
          <div key={photo.id} className="relative group w-24 h-24">
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </div>

            {photo.isPrimary && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-[10px] text-center py-0.5 rounded-b-lg font-medium">
                Main
              </div>
            )}

            {/* Hover controls */}
            <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              {!photo.isPrimary && (
                <button
                  type="button"
                  onClick={() => setAsPrimary(photo.id)}
                  title="Set as main photo"
                  className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                disabled={removing === photo.id}
                title="Remove photo"
                className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
              >
                {removing === photo.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <X className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}

        {/* Upload target */}
        <label
          className={cn(
            "w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors",
            uploading
              ? "opacity-60 cursor-not-allowed border-muted"
              : "cursor-pointer hover:border-primary hover:bg-primary/5 border-border"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-[10px] text-muted-foreground">Uploading…</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">Add photo</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        JPEG, PNG or WebP · max 4 MB · hover a photo to set as main or remove
      </p>
    </div>
  )
}
