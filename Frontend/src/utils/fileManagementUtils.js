// Comprehensive file management utility functions

// File Manager Class
export class FileManager {
  constructor(options = {}) {
    this.options = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['image/*', 'application/pdf', 'text/*'],
      maxFiles: 10,
      enablePreview: true,
      enableCompression: true,
      enableValidation: true,
      ...options
    };
    
    this.uploadQueue = [];
    this.activeUploads = new Map();
    this.completedUploads = [];
    this.listeners = new Set();
    this.fileCache = new Map();
  }

  // Add files to upload queue
  addFiles(files) {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      const validation = this.validateFile(file);
      
      if (validation.isValid) {
        const fileData = {
          id: this.generateFileId(),
          file,
          status: 'queued',
          progress: 0,
          uploaded: 0,
          total: file.size,
          speed: 0,
          timeRemaining: 0,
          addedAt: Date.now()
        };
        
        this.uploadQueue.push(fileData);
        validFiles.push(fileData);
        
        // Cache file for preview
        if (this.options.enablePreview) {
          this.cacheFile(fileData);
        }
      } else {
        errors.push({ file: file.name, errors: validation.errors });
      }
    });

    this.notifyListeners('filesAdded', { validFiles, errors });
    return { validFiles, errors };
  }

  // Validate file
  validateFile(file) {
    const errors = [];
    
    if (!this.options.enableValidation) {
      return { isValid: true, errors: [] };
    }

    // Check file size
    if (file.size > this.options.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.formatFileSize(this.options.maxFileSize)}`);
    }

    // Check file type
    const isAllowedType = this.options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check max files limit
    if (this.uploadQueue.length + this.completedUploads.length >= this.options.maxFiles) {
      errors.push(`Maximum number of files (${this.options.maxFiles}) exceeded`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Start upload
  startUpload(fileId) {
    const fileData = this.uploadQueue.find(f => f.id === fileId);
    if (!fileData) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    fileData.status = 'uploading';
    fileData.startedAt = Date.now();
    
    this.activeUploads.set(fileId, fileData);
    this.notifyListeners('uploadStarted', fileData);

    // Simulate upload progress
    this.simulateUpload(fileData);
    
    return fileId;
  }

  // Start all uploads
  startAllUploads() {
    const uploadPromises = this.uploadQueue
      .filter(file => file.status === 'queued')
      .map(file => this.startUpload(file.id));
    
    return Promise.all(uploadPromises);
  }

  // Simulate upload progress
  simulateUpload(fileData) {
    const interval = setInterval(() => {
      if (fileData.uploaded < fileData.total) {
        const increment = Math.min(
          Math.random() * fileData.total * 0.1,
          fileData.total - fileData.uploaded
        );
        
        fileData.uploaded += increment;
        fileData.progress = (fileData.uploaded / fileData.total) * 100;
        
        // Calculate speed and time remaining
        const elapsed = Date.now() - fileData.startedAt;
        fileData.speed = fileData.uploaded / (elapsed / 1000);
        
        if (fileData.speed > 0) {
          fileData.timeRemaining = (fileData.total - fileData.uploaded) / fileData.speed;
        }
        
        this.notifyListeners('uploadProgress', fileData);
      } else {
        clearInterval(interval);
        this.completeUpload(fileData.id);
      }
    }, 100);
  }

  // Complete upload
  completeUpload(fileId) {
    const fileData = this.activeUploads.get(fileId);
    if (!fileData) return;

    fileData.status = 'completed';
    fileData.completedAt = Date.now();
    fileData.progress = 100;
    fileData.uploaded = fileData.total;

    this.activeUploads.delete(fileId);
    this.completedUploads.push(fileData);
    
    // Remove from queue
    const queueIndex = this.uploadQueue.findIndex(f => f.id === fileId);
    if (queueIndex > -1) {
      this.uploadQueue.splice(queueIndex, 1);
    }

    this.notifyListeners('uploadCompleted', fileData);
  }

  // Cancel upload
  cancelUpload(fileId) {
    const fileData = this.activeUploads.get(fileId);
    if (fileData) {
      fileData.status = 'cancelled';
      this.activeUploads.delete(fileId);
      
      // Remove from queue
      const queueIndex = this.uploadQueue.findIndex(f => f.id === fileId);
      if (queueIndex > -1) {
        this.uploadQueue.splice(queueIndex, 1);
      }
      
      this.notifyListeners('uploadCancelled', fileData);
    }
  }

  // Retry upload
  retryUpload(fileId) {
    const fileData = this.uploadQueue.find(f => f.id === fileId);
    if (fileData) {
      fileData.status = 'queued';
      fileData.progress = 0;
      fileData.uploaded = 0;
      fileData.speed = 0;
      fileData.timeRemaining = 0;
      
      this.notifyListeners('uploadRetry', fileData);
      return this.startUpload(fileId);
    }
  }

  // Cache file for preview
  cacheFile(fileData) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      this.fileCache.set(fileData.id, {
        url: e.target.result,
        type: fileData.file.type,
        name: fileData.file.name,
        size: fileData.file.size
      });
    };
    
    reader.readAsDataURL(fileData.file);
  }

  // Get file preview URL
  getPreviewUrl(fileId) {
    const cached = this.fileCache.get(fileId);
    return cached ? cached.url : null;
  }

  // Clear completed uploads
  clearCompleted() {
    this.completedUploads = [];
    this.notifyListeners('completedCleared');
  }

  // Clear all uploads
  clearAll() {
    this.uploadQueue = [];
    this.activeUploads.clear();
    this.completedUploads = [];
    this.fileCache.clear();
    this.notifyListeners('allCleared');
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('File manager listener error:', error);
      }
    });
  }

  // Get upload statistics
  getStats() {
    const totalSize = this.uploadQueue.reduce((sum, file) => sum + file.total, 0);
    const uploadedSize = this.uploadQueue.reduce((sum, file) => sum + file.uploaded, 0);
    const activeSize = Array.from(this.activeUploads.values())
      .reduce((sum, file) => sum + file.total, 0);
    
    return {
      queued: this.uploadQueue.length,
      active: this.activeUploads.size,
      completed: this.completedUploads.length,
      totalSize,
      uploadedSize,
      activeSize,
      overallProgress: totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0
    };
  }

  // Generate unique file ID
  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format file size
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Get file by ID
  getFile(fileId) {
    return this.uploadQueue.find(f => f.id === fileId) ||
           this.activeUploads.get(fileId) ||
           this.completedUploads.find(f => f.id === fileId);
  }

  // Get all files
  getAllFiles() {
    return [
      ...this.uploadQueue,
      ...Array.from(this.activeUploads.values()),
      ...this.completedUploads
    ];
  }
}

// File Validator Class
export class FileValidator {
  constructor(rules = {}) {
    this.rules = {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [],
      maxFiles: 10,
      minSize: 0,
      required: false,
      ...rules
    };
  }

  // Validate single file
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size < this.rules.minSize) {
      errors.push(`File size must be at least ${this.formatFileSize(this.rules.minSize)}`);
    }

    if (file.size > this.rules.maxSize) {
      errors.push(`File size cannot exceed ${this.formatFileSize(this.rules.maxSize)}`);
    }

    // Check file type
    if (this.rules.allowedTypes.length > 0) {
      const isAllowed = this.rules.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        errors.push(`File type ${file.type} is not allowed`);
      }
    }

    // Check file name
    if (!file.name || file.name.trim() === '') {
      errors.push('File name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate multiple files
  validateFiles(files) {
    const results = [];
    let totalValid = 0;

    Array.from(files).forEach(file => {
      const validation = this.validateFile(file);
      results.push({
        file,
        ...validation
      });
      
      if (validation.isValid) {
        totalValid++;
      }
    });

    // Check max files limit
    if (totalValid > this.rules.maxFiles) {
      results.forEach(result => {
        if (result.isValid) {
          result.isValid = false;
          result.errors.push(`Maximum ${this.rules.maxFiles} files allowed`);
        }
      });
    }

    // Check required
    if (this.rules.required && files.length === 0) {
      return {
        isValid: false,
        errors: ['At least one file is required'],
        results: []
      };
    }

    const allValid = results.every(result => result.isValid);
    const allErrors = results.flatMap(result => result.errors);

    return {
      isValid: allValid,
      errors: allErrors,
      results
    };
  }

  // Format file size
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// File Preview Generator
export class FilePreviewGenerator {
  constructor() {
    this.cache = new Map();
  }

  // Generate preview for image
  async generateImagePreview(file, maxWidth = 200, maxHeight = 200) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and resize
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            resolve({ url, width, height });
          }, 'image/jpeg', 0.8);
        };
        
        img.onerror = reject;
        img.src = e.target.result;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Generate preview for PDF
  async generatePDFPreview(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      resolve({ 
        url, 
        type: 'pdf',
        icon: '📄',
        title: file.name
      });
    });
  }

  // Generate preview for video
  async generateVideoPreview(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      resolve({ 
        url, 
        type: 'video',
        thumbnail: this.generateVideoThumbnail(url)
      });
    });
  }

  // Generate video thumbnail
  generateVideoThumbnail(url) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 160, 90);
        
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        });
      };
    });
  }

  // Generate preview based on file type
  async generatePreview(file) {
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let preview;

    if (file.type.startsWith('image/')) {
      preview = await this.generateImagePreview(file);
    } else if (file.type === 'application/pdf') {
      preview = await this.generatePDFPreview(file);
    } else if (file.type.startsWith('video/')) {
      preview = await this.generateVideoPreview(file);
    } else {
      preview = {
        type: 'generic',
        icon: this.getFileIcon(file.type),
        title: file.name
      };
    }

    this.cache.set(cacheKey, preview);
    return preview;
  }

  // Get file icon based on type
  getFileIcon(type) {
    const iconMap = {
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.ms-powerpoint': '📈',
      'text/plain': '📄',
      'application/zip': '📦',
      'audio/': '🎵',
      'video/': '🎬',
      'image/': '🖼️'
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (type.startsWith(key)) {
        return icon;
      }
    }

    return '📄';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Create global instances
export const fileManager = new FileManager();
export const fileValidator = new FileValidator();
export const filePreviewGenerator = new FilePreviewGenerator();

// Initialize file management system
export const initializeFileManagement = (options = {}) => {
  const manager = new FileManager(options);
  const validator = new FileValidator(options.validation || {});
  const previewGenerator = new FilePreviewGenerator();

  return {
    manager,
    validator,
    previewGenerator
  };
};
