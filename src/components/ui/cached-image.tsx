'use client'

import { useState, useEffect, useRef } from 'react'
import { getCachedImage, cacheImage, createCachedImageUrl } from '@/lib/cache'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallback?: React.ReactNode
  onCached?: () => void
}

export function CachedImage({ 
  src, 
  fallback, 
  onCached,
  className,
  alt = '',
  ...props 
}: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [cachedUrl, setCachedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadImage() {
      if (!src) return

      try {
        // 先检查缓存
        const cachedBlob = await getCachedImage(src)
        
        if (cachedBlob && mounted) {
          const url = createCachedImageUrl(cachedBlob)
          urlRef.current = url
          setCachedUrl(url)
          setIsLoading(false)
          onCached?.()
          return
        }

        // 如果没有缓存，加载图片
        const response = await fetch(src)
        if (!response.ok) throw new Error('Failed to load image')
        
        const blob = await response.blob()
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        
        // 缓存图片
        await cacheImage(src, blob, mimeType)
        
        if (mounted) {
          const url = createCachedImageUrl(blob)
          urlRef.current = url
          setCachedUrl(url)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load cached image:', err)
        if (mounted) {
          setError(true)
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      mounted = false
      // 清理 blob URL
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [src, onCached])

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        {fallback || <span className="text-muted-foreground text-sm">加载失败</span>}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={cachedUrl || src}
      alt={alt}
      className={className}
      {...props}
    />
  )
} 