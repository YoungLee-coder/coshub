'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BucketFormData, BucketWithStats } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const bucketSchema = z.object({
  name: z.string().min(3, '存储桶名称至少3个字符').regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和横线'),
  region: z.string().min(1, '请选择地域'),
  secretId: z.string().min(1, '请输入SecretId'),
  secretKey: z.string().min(1, '请输入SecretKey'),
  customDomain: z.string().transform((val) => {
    if (!val) return ''
    // 如果没有协议，自动添加https://
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      return `https://${val}`
    }
    return val
  }).refine((val) => !val || z.string().url().safeParse(val).success, {
    message: '请输入有效的域名'
  }),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
})

// 编辑模式的 schema，SecretId 和 SecretKey 是可选的
const editBucketSchema = z.object({
  name: z.string().min(3, '存储桶名称至少3个字符').regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和横线'),
  region: z.string().min(1, '请选择地域'),
  secretId: z.string().optional(),
  secretKey: z.string().optional(),
  customDomain: z.string().transform((val) => {
    if (!val) return ''
    // 如果没有协议，自动添加https://
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      return `https://${val}`
    }
    return val
  }).refine((val) => !val || z.string().url().safeParse(val).success, {
    message: '请输入有效的域名'
  }),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
})

// 腾讯云COS地域列表
const COS_REGIONS = [
  { value: 'ap-beijing', label: '北京' },
  { value: 'ap-beijing-1', label: '北京一区' },
  { value: 'ap-nanjing', label: '南京' },
  { value: 'ap-shanghai', label: '上海' },
  { value: 'ap-guangzhou', label: '广州' },
  { value: 'ap-chengdu', label: '成都' },
  { value: 'ap-chongqing', label: '重庆' },
  { value: 'ap-shenzhen-fsi', label: '深圳金融' },
  { value: 'ap-shanghai-fsi', label: '上海金融' },
  { value: 'ap-beijing-fsi', label: '北京金融' },
  { value: 'ap-hongkong', label: '中国香港' },
  { value: 'ap-taipei', label: '中国台北' },
  { value: 'ap-singapore', label: '新加坡' },
  { value: 'ap-mumbai', label: '孟买' },
  { value: 'ap-jakarta', label: '雅加达' },
  { value: 'ap-seoul', label: '首尔' },
  { value: 'ap-bangkok', label: '曼谷' },
  { value: 'ap-tokyo', label: '东京' },
  { value: 'na-toronto', label: '多伦多' },
  { value: 'na-siliconvalley', label: '硅谷' },
  { value: 'na-newyork', label: '纽约' },
  { value: 'na-ashburn', label: '弗吉尼亚' },
  { value: 'sa-saopaulo', label: '圣保罗' },
  { value: 'eu-frankfurt', label: '法兰克福' },
]

interface BucketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bucket?: BucketWithStats
  onSuccess?: () => void
}

export function BucketDialog({ open, onOpenChange, bucket, onSuccess }: BucketDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = !!bucket
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BucketFormData>({
    resolver: zodResolver(isEdit ? editBucketSchema : bucketSchema),
    defaultValues: {
      name: bucket?.name || '',
      region: bucket?.region || '',
      secretId: '',
      secretKey: '',
      customDomain: bucket?.customDomain || '',
      description: bucket?.description || '',
      isDefault: bucket?.isDefault || false,
    }
  })
  
  const selectedRegion = watch('region')
  
  const onSubmit = async (data: BucketFormData) => {
    setIsLoading(true)
    
    try {
      const res = await fetch(`/api/buckets${isEdit ? `/${bucket.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        toast({
          title: '操作失败',
          description: result.error || '请重试',
          variant: 'destructive',
        })
        return
      }
      
      toast({
        title: '操作成功',
        description: isEdit ? '存储桶已更新' : '存储桶已创建',
      })
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Bucket operation failed:', error)
      toast({
        title: '操作失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑存储桶' : '添加存储桶'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改存储桶配置信息' : '配置腾讯云COS存储桶信息'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">存储桶名称</Label>
              <Input
                id="name"
                placeholder="my-bucket-1234567890"
                {...register('name')}
                disabled={isEdit}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="region">所在地域</Label>
              <Select
                value={selectedRegion}
                onValueChange={(value) => setValue('region', value)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择地域" />
                </SelectTrigger>
                <SelectContent>
                  {COS_REGIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label} ({region.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secretId">SecretId</Label>
              <Input
                id="secretId"
                type="password"
                placeholder={isEdit ? '留空则不修改' : '请输入SecretId'}
                {...register('secretId')}
              />
              {errors.secretId && (
                <p className="text-sm text-destructive">{errors.secretId.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secretKey">SecretKey</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder={isEdit ? '留空则不修改' : '请输入SecretKey'}
                {...register('secretKey')}
              />
              {errors.secretKey && (
                <p className="text-sm text-destructive">{errors.secretKey.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="customDomain">自定义域名（可选）</Label>
              <Input
                id="customDomain"
                placeholder="cdn.example.com 或 https://cdn.example.com"
                {...register('customDomain')}
              />
              {errors.customDomain && (
                <p className="text-sm text-destructive">{errors.customDomain.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                如果不包含协议，将自动添加 https://
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                placeholder="存储桶用途说明"
                {...register('description')}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                className="h-4 w-4 rounded border-gray-300"
                {...register('isDefault')}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                设为默认存储桶
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 