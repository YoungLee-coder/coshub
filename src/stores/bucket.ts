import { create } from 'zustand'
import { BucketWithStats } from '@/types'

interface BucketStore {
  buckets: BucketWithStats[]
  selectedBucketId: string | null
  selectedBucket: BucketWithStats | null
  
  // Actions
  setBuckets: (buckets: BucketWithStats[]) => void
  selectBucket: (bucketId: string | null) => void
  addBucket: (bucket: BucketWithStats) => void
  updateBucket: (bucketId: string, data: Partial<BucketWithStats>) => void
  deleteBucket: (bucketId: string) => void
}

export const useBucketStore = create<BucketStore>((set, get) => ({
  buckets: [],
  selectedBucketId: null,
  selectedBucket: null,
  
  setBuckets: (buckets) => set((state) => {
    // 如果有选中的存储桶，从新的 buckets 中找到并更新
    const updatedSelectedBucket = state.selectedBucketId 
      ? buckets.find(b => b.id === state.selectedBucketId) || null
      : null
    
    return {
      buckets,
      selectedBucket: updatedSelectedBucket
    }
  }),
  
  selectBucket: (bucketId) => {
    const bucket = bucketId ? get().buckets.find(b => b.id === bucketId) : null
    set({ 
      selectedBucketId: bucketId,
      selectedBucket: bucket || null
    })
  },
  
  addBucket: (bucket) => set((state) => ({
    buckets: [...state.buckets, bucket]
  })),
  
  updateBucket: (bucketId, data) => set((state) => {
    const updatedBuckets = state.buckets.map(b => 
      b.id === bucketId ? { ...b, ...data } : b
    )
    
    // 如果更新的是当前选中的存储桶，同时更新 selectedBucket
    const isSelectedBucket = state.selectedBucketId === bucketId
    const updatedSelectedBucket = isSelectedBucket 
      ? updatedBuckets.find(b => b.id === bucketId) || null
      : state.selectedBucket
    
    return {
      buckets: updatedBuckets,
      selectedBucket: updatedSelectedBucket
    }
  }),
  
  deleteBucket: (bucketId) => set((state) => ({
    buckets: state.buckets.filter(b => b.id !== bucketId),
    selectedBucketId: state.selectedBucketId === bucketId ? null : state.selectedBucketId,
    selectedBucket: state.selectedBucketId === bucketId ? null : state.selectedBucket
  }))
})) 