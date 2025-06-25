// COS相关类型
export interface CosConfig {
  secretId: string;
  secretKey: string;
  region: string;
  bucket: string;
  customDomain?: string;
}

export interface CosFile {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  eTag?: string;
  storageClass?: string;
}

// 应用相关类型
export interface BucketWithStats {
  id: string;
  name: string;
  region: string;
  customDomain?: string;
  description?: string;
  isDefault: boolean;
  fileCount?: number;
  totalSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileWithUrl {
  id: string;
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  bucketId: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 表单类型
export interface BucketFormData {
  name: string;
  region: string;
  secretId: string;
  secretKey: string;
  customDomain?: string;
  description?: string;
  isDefault?: boolean;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface InitializeFormData {
  username: string;
  password: string;
  confirmPassword: string;
} 