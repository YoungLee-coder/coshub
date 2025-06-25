'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen } from 'lucide-react'
import { useBucketStore } from '@/stores/bucket'
import { BucketWithStats } from '@/types'

interface BucketSelectorProps {
  onAddBucket?: () => void
}

export function BucketSelector({ onAddBucket }: BucketSelectorProps) {
  const { 
    selectedBucketId, 
    selectBucket, 
    setBuckets 
  } = useBucketStore()
  
  const { data: buckets, isLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: async () => {
      const res = await fetch('/api/buckets')
      if (!res.ok) throw new Error('Failed to fetch buckets')
      return res.json()
    }
  })
  
  // 更新store中的buckets数据
  useEffect(() => {
    if (buckets) {
      setBuckets(buckets)
      
      // 如果没有选中的存储桶，选择默认的或第一个
      if (!selectedBucketId && buckets.length > 0) {
        const defaultBucket = buckets.find((b: BucketWithStats) => b.isDefault)
        selectBucket(defaultBucket?.id || buckets[0].id)
      }
    }
  }, [buckets, selectedBucketId, setBuckets, selectBucket])
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">加载中...</span>
      </div>
    )
  }
  
  if (!buckets || buckets.length === 0) {
    return (
      <Button onClick={onAddBucket} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        添加存储桶
      </Button>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      <FolderOpen className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedBucketId || ''} onValueChange={selectBucket}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="选择存储桶" />
        </SelectTrigger>
        <SelectContent>
          {buckets.map((bucket: BucketWithStats) => (
            <SelectItem key={bucket.id} value={bucket.id}>
              <div className="flex items-center gap-2">
                <span>{bucket.name}</span>
                {bucket.isDefault && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    默认
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 