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
  
  setBuckets: (buckets) => set({ buckets }),
  
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
  
  updateBucket: (bucketId, data) => set((state) => ({
    buckets: state.buckets.map(b => 
      b.id === bucketId ? { ...b, ...data } : b
    )
  })),
  
  deleteBucket: (bucketId) => set((state) => ({
    buckets: state.buckets.filter(b => b.id !== bucketId),
    selectedBucketId: state.selectedBucketId === bucketId ? null : state.selectedBucketId,
    selectedBucket: state.selectedBucketId === bucketId ? null : state.selectedBucket
  }))
})) 