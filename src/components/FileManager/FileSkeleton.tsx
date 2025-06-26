'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface FileSkeletonProps {
  rows?: number
  type?: 'list' | 'grid'
}

export function FileSkeleton({ rows = 5, type = 'list' }: FileSkeletonProps) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: rows * 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="h-24 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead className="w-16">预览</TableHead>
            <TableHead>文件名</TableHead>
            <TableHead>大小</TableHead>
            <TableHead>修改时间</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-10 w-10 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 