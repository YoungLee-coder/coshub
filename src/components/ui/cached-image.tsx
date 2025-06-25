'use client'

import { useState, useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCachedImage, cacheImage, createCachedImageUrl } from '@/lib/cache'
import { cn } from '@/lib/utils'

interface CachedImageProps {
  src: string
  alt: string
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
}

export function CachedImage({ 
  src, 
  alt, 
  className,
  fallback,
  priority = false
}: CachedImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let mounted = true
    
    const loadImage = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // 首先检查缓存
        const cachedBlob = await getCachedImage(src)
        
        if (cachedBlob && mounted) {
          const url = createCachedImageUrl(cachedBlob)
          setImageUrl(url)
          setLoading(false)
          return
        }
        
        // 如果没有缓存，直接使用原始URL
        setImageUrl(src)
        
        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(true)
          setLoading(false)
          console.error('Failed to load cached image:', err)
        }
      }
    }
    
    loadImage()
    
    return () => {
      mounted = false
    }
  }, [src, priority])

  // 图片加载完成后缓存
  const handleLoad = async () => {
    if (!priority && imageUrl && src === imageUrl) {
      try {
        const response = await fetch(src)
        if (response.ok) {
          const blob = await response.blob()
          const mimeType = response.headers.get('content-type') || 'image/jpeg'
          await cacheImage(src, blob, mimeType)
        }
      } catch {
        // 忽略缓存错误
      }
    }
  }

  if (loading) {
    return (
      <Skeleton 
        className={cn("bg-muted", className)} 
      />
    )
  }

  if (error || !imageUrl) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div 
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground",
          className
        )}
      >
        加载失败
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={() => {
        setError(true)
        setLoading(false)
      }}
      loading={priority ? "eager" : "lazy"}
    />
  )
} 