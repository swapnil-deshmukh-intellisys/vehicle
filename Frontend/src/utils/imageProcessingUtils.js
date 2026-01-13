// Comprehensive image processing utility functions

// Image Processor Class
export class ImageProcessor {
  constructor(options = {}) {
    this.options = {
      defaultQuality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      enableCompression: true,
      enableResizing: true,
      enableFilters: true,
      outputFormat: 'auto',
      ...options
    };
    
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.cache = new Map();
  }

  // Load image from file or URL
  async loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = reject;
      
      if (typeof source === 'string') {
        img.src = source;
      } else if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(source);
      } else {
        reject(new Error('Invalid image source'));
      }
    });
  }

  // Resize image
  async resize(img, options = {}) {
    const {
      width,
      height,
      maintainAspectRatio = true,
      fit = 'contain', // 'contain', 'cover', 'fill', 'inside', 'outside'
      upscale = false
    } = options;

    let targetWidth = width || img.width;
    let targetHeight = height || img.height;

    if (maintainAspectRatio) {
      const aspectRatio = img.width / img.height;
      
      if (width && height) {
        // Both dimensions specified
        const targetAspectRatio = width / height;
        
        if (fit === 'contain' || fit === 'inside') {
          if (aspectRatio > targetAspectRatio) {
            targetHeight = width / aspectRatio;
          } else {
            targetWidth = height * aspectRatio;
          }
        } else if (fit === 'cover' || fit === 'outside') {
          if (aspectRatio > targetAspectRatio) {
            targetWidth = height * aspectRatio;
          } else {
            targetHeight = width / aspectRatio;
          }
        }
      } else if (width) {
        // Only width specified
        targetHeight = width / aspectRatio;
      } else {
        // Only height specified
        targetWidth = height * aspectRatio;
      }
    }

    // Prevent upscaling unless explicitly allowed
    if (!upscale) {
      targetWidth = Math.min(targetWidth, img.width);
      targetHeight = Math.min(targetHeight, img.height);
    }

    // Setup canvas
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Draw image
    this.ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return {
      width: targetWidth,
      height: targetHeight,
      canvas: this.canvas
    };
  }

  // Apply filters to image
  async applyFilters(img, filters = {}) {
    const {
      brightness = 1.0,
      contrast = 1.0,
      saturation = 1.0,
      grayscale = false,
      sepia = false,
      invert = false,
      blur = 0,
      sharpen = 0
    } = filters;

    // Setup canvas with original image dimensions
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    
    // Draw original image
    this.ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    // Apply pixel-level filters
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r = Math.min(255, r * brightness);
      g = Math.min(255, g * brightness);
      b = Math.min(255, b * brightness);

      // Contrast
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

      // Saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = Math.min(255, Math.max(0, gray + saturation * (r - gray)));
      g = Math.min(255, Math.max(0, gray + saturation * (g - gray)));
      b = Math.min(255, Math.max(0, gray + saturation * (b - gray)));

      // Grayscale
      if (grayscale) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = g = b = gray;
      }

      // Sepia
      if (sepia) {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = Math.min(255, tr);
        g = Math.min(255, tg);
        b = Math.min(255, tb);
      }

      // Invert
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // Put filtered image data back
    this.ctx.putImageData(imageData, 0, 0);

    // Apply blur filter if needed
    if (blur > 0) {
      this.applyBlur(blur);
    }

    // Apply sharpen filter if needed
    if (sharpen > 0) {
      this.applySharpen(sharpen);
    }

    return {
      width: img.width,
      height: img.height,
      canvas: this.canvas
    };
  }

  // Apply blur filter
  applyBlur(radius) {
    this.ctx.filter = `blur(${radius}px)`;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.filter = 'none';
  }

  // Apply sharpen filter
  applySharpen(amount) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    const output = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          
          const idx = (y * width + x) * 4 + c;
          output[idx] = Math.min(255, Math.max(0, sum * amount + data[idx] * (1 - amount)));
        }
      }
    }
    
    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Crop image
  async crop(img, x, y, width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    
    return {
      width,
      height,
      canvas: this.canvas
    };
  }

  // Rotate image
  async rotate(img, angle) {
    const radians = (angle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    
    const width = img.width * cos + img.height * sin;
    const height = img.width * sin + img.height * cos;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.rotate(radians);
    this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
    this.ctx.restore();
    
    return {
      width,
      height,
      canvas: this.canvas
    };
  }

  // Flip image
  async flip(img, direction = 'horizontal') {
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    
    this.ctx.save();
    
    if (direction === 'horizontal') {
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(img, -img.width, 0);
    } else {
      this.ctx.scale(1, -1);
      this.ctx.drawImage(img, 0, -img.height);
    }
    
    this.ctx.restore();
    
    return {
      width: img.width,
      height: img.height,
      canvas: this.canvas
    };
  }

  // Convert image to different format
  async convert(img, format = 'jpeg', quality = 0.8) {
    const mimeType = this.getMimeType(format);
    
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            mimeType,
            size: blob.size
          });
        } else {
          reject(new Error('Failed to convert image'));
        }
      }, mimeType, quality);
    });
  }

  // Get MIME type for format
  getMimeType(format) {
    const formatMap = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp'
    };
    
    return formatMap[format.toLowerCase()] || 'image/jpeg';
  }

  // Process image with multiple operations
  async processImage(source, operations = {}) {
    const img = await this.loadImage(source);
    let currentImg = img;
    let result = { width: img.width, height: img.height, canvas: this.canvas };

    // Resize
    if (operations.resize && this.options.enableResizing) {
      result = await this.resize(currentImg, operations.resize);
      currentImg = await this.loadImage(result.canvas.toDataURL());
    }

    // Crop
    if (operations.crop) {
      result = await this.crop(currentImg, operations.crop.x, operations.crop.y, 
                              operations.crop.width, operations.crop.height);
      currentImg = await this.loadImage(result.canvas.toDataURL());
    }

    // Rotate
    if (operations.rotate) {
      result = await this.rotate(currentImg, operations.rotate);
      currentImg = await this.loadImage(result.canvas.toDataURL());
    }

    // Flip
    if (operations.flip) {
      result = await this.flip(currentImg, operations.flip);
      currentImg = await this.loadImage(result.canvas.toDataURL());
    }

    // Filters
    if (operations.filters && this.options.enableFilters) {
      result = await this.applyFilters(currentImg, operations.filters);
      currentImg = await this.loadImage(result.canvas.toDataURL());
    }

    // Convert format
    if (operations.format) {
      const converted = await this.convert(result.canvas, operations.format, operations.quality);
      result.converted = converted;
    }

    return result;
  }

  // Get image info
  async getImageInfo(source) {
    const img = await this.loadImage(source);
    
    return {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height,
      size: source instanceof File ? source.size : null,
      type: source instanceof File ? source.type : null,
      name: source instanceof File ? source.name : null
    };
  }

  // Generate thumbnail
  async generateThumbnail(source, size = 150, quality = 0.8) {
    const img = await this.loadImage(source);
    
    // Calculate dimensions maintaining aspect ratio
    let { width, height } = img;
    
    if (width > height) {
      if (width > size) {
        height = (height * size) / width;
        width = size;
      }
    } else {
      if (height > size) {
        width = (width * size) / height;
        height = size;
      }
    }

    const result = await this.resize(img, { width, height, maintainAspectRatio: true });
    
    return new Promise((resolve, reject) => {
      result.canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            width: result.width,
            height: result.height
          });
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      }, 'image/jpeg', quality);
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Image Optimizer Class
export class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      enableProgressiveJPEG: true,
      enableWebP: true,
      enableAVIF: false,
      ...options
    };
  }

  // Optimize image for web
  async optimize(source) {
    const processor = new ImageProcessor(this.options);
    const img = await processor.loadImage(source);
    
    // Get original info
    const originalInfo = await processor.getImageInfo(source);
    
    // Determine if resizing is needed
    const needsResize = originalInfo.width > this.options.maxWidth || 
                       originalInfo.height > this.options.maxHeight;
    
    let result = { canvas: processor.canvas, width: originalInfo.width, height: originalInfo.height };
    
    if (needsResize) {
      result = await processor.resize(img, {
        width: this.options.maxWidth,
        height: this.options.maxHeight,
        maintainAspectRatio: true
      });
    }

    // Determine best format
    let format = 'jpeg';
    if (this.options.enableWebP && this.supportsWebP()) {
      format = 'webp';
    } else if (this.options.enableAVIF && this.supportsAVIF()) {
      format = 'avif';
    }

    // Convert and compress
    const optimized = await processor.convert(result.canvas, format, this.options.quality);
    
    return {
      original: originalInfo,
      optimized: {
        ...optimized,
        width: result.width,
        height: result.height,
        compressionRatio: optimized.size / (originalInfo.size || 1),
        format
      }
    };
  }

  // Check WebP support
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Check AVIF support
  supportsAVIF() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  // Batch optimize multiple images
  async batchOptimize(sources, options = {}) {
    const results = [];
    
    for (const source of sources) {
      try {
        const result = await this.optimize(source, options);
        results.push({ source, result, success: true });
      } catch (error) {
        results.push({ source, error, success: false });
      }
    }
    
    return results;
  }
}

// Image Filter Presets
export const IMAGE_FILTERS = {
  // Basic adjustments
  BRIGHTNESS: { brightness: 1.2 },
  DARKNESS: { brightness: 0.8 },
  HIGH_CONTRAST: { contrast: 1.5 },
  LOW_CONTRAST: { contrast: 0.8 },
  
  // Color effects
  GRAYSCALE: { grayscale: true },
  SEPIA: { sepia: true },
  INVERT: { invert: true },
  
  // Vintage effects
  VINTAGE: { sepia: true, contrast: 1.1, brightness: 0.9 },
  COLD: { brightness: 1.1, saturation: 0.8 },
  WARM: { brightness: 1.1, saturation: 1.2 },
  
  // Artistic effects
  DRAMATIC: { contrast: 1.3, saturation: 1.2 },
  SOFT: { brightness: 1.1, contrast: 0.9 },
  VIVID: { saturation: 1.5, contrast: 1.1 },
  
  // Blur effects
  BLUR_LIGHT: { blur: 1 },
  BLUR_MEDIUM: { blur: 3 },
  BLUR_HEAVY: { blur: 5 },
  
  // Sharpen effects
  SHARPEN_LIGHT: { sharpen: 0.3 },
  SHARPEN_MEDIUM: { sharpen: 0.5 },
  SHARPEN_HEAVY: { sharpen: 0.7 }
};

// Create global instances
export const imageProcessor = new ImageProcessor();
export const imageOptimizer = new ImageOptimizer();

// Initialize image processing system
export const initializeImageProcessing = (options = {}) => {
  const processor = new ImageProcessor(options.processor || {});
  const optimizer = new ImageOptimizer(options.optimizer || {});

  return {
    processor,
    optimizer,
    filters: IMAGE_FILTERS
  };
};
