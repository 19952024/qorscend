const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Storage } = require('@google-cloud/storage');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class CloudStorageService {
  constructor() {
    this.provider = process.env.CLOUD_STORAGE_PROVIDER || 'local';
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'aws':
        this.initializeAWS();
        break;
      case 'gcp':
        this.initializeGCP();
        break;
      case 'azure':
        this.initializeAzure();
        break;
      case 'local':
      default:
        this.initializeLocal();
        break;
    }
  }

  initializeAWS() {
    try {
      this.bucketName = process.env.AWS_S3_BUCKET;
      
      if (!this.bucketName) {
        throw new Error('AWS_S3_BUCKET environment variable is required');
      }

      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      
      logger.info('AWS S3 storage initialized');
    } catch (error) {
      logger.error('Failed to initialize AWS S3:', error);
      this.fallbackToLocal();
    }
  }

  initializeGCP() {
    try {
      this.gcs = new Storage({
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
      
      this.bucketName = process.env.GOOGLE_CLOUD_BUCKET;
      
      if (!this.bucketName) {
        throw new Error('GOOGLE_CLOUD_BUCKET environment variable is required');
      }
      
      this.bucket = this.gcs.bucket(this.bucketName);
      logger.info('Google Cloud Storage initialized');
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage:', error);
      this.fallbackToLocal();
    }
  }

  initializeAzure() {
    try {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const containerName = process.env.AZURE_STORAGE_CONTAINER;
      
      if (!connectionString || !containerName) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER environment variables are required');
      }
      
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerName = containerName;
      this.containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      logger.info('Azure Blob Storage initialized');
    } catch (error) {
      logger.error('Failed to initialize Azure Blob Storage:', error);
      this.fallbackToLocal();
    }
  }

  initializeLocal() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDir();
    logger.info('Local storage initialized');
  }

  fallbackToLocal() {
    logger.warn('Falling back to local storage');
    this.provider = 'local';
    this.initializeLocal();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  generateFileName(originalName, userId) {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${userId}/${timestamp}-${hash}-${name}${ext}`;
  }

  async uploadFile(fileBuffer, fileName, contentType, userId) {
    const cloudFileName = this.generateFileName(fileName, userId);
    
    try {
      switch (this.provider) {
        case 'aws':
          return await this.uploadToAWS(fileBuffer, cloudFileName, contentType);
        case 'gcp':
          return await this.uploadToGCP(fileBuffer, cloudFileName, contentType);
        case 'azure':
          return await this.uploadToAzure(fileBuffer, cloudFileName, contentType);
        case 'local':
        default:
          return await this.uploadToLocal(fileBuffer, cloudFileName);
      }
    } catch (error) {
      logger.error(`Upload failed for provider ${this.provider}:`, error);
      
      // Fallback to local storage
      if (this.provider !== 'local') {
        logger.info('Falling back to local storage for upload');
        return await this.uploadToLocal(fileBuffer, cloudFileName);
      }
      
      throw error;
    }
  }

  async uploadToAWS(fileBuffer, fileName, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read'
    });

    await this.s3.send(command);
    
    // Construct the URL manually for AWS SDK v3
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    
    return {
      url: url,
      key: fileName,
      provider: 'aws'
    };
  }

  async uploadToGCP(fileBuffer, fileName, contentType) {
    const file = this.bucket.file(fileName);
    
    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType
      },
      public: true
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2100'
    });

    return {
      url: url,
      key: fileName,
      provider: 'gcp'
    };
  }

  async uploadToAzure(fileBuffer, fileName, contentType) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });

    return {
      url: blockBlobClient.url,
      key: fileName,
      provider: 'azure'
    };
  }

  async uploadToLocal(fileBuffer, fileName) {
    const filePath = path.join(this.uploadDir, fileName);
    const dirPath = path.dirname(filePath);
    
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);
    
    // Determine the correct base URL
    let baseUrl;
    if (process.env.BASE_URL) {
      baseUrl = process.env.BASE_URL;
    } else if (process.env.RENDER_EXTERNAL_URL) {
      baseUrl = process.env.RENDER_EXTERNAL_URL;
    } else if (process.env.NODE_ENV === 'production') {
      baseUrl = 'https://qorscend-backend.onrender.com';
    } else {
      baseUrl = 'http://localhost:5000';
    }
    const url = `${baseUrl}/uploads/${fileName}`;
    
    return {
      url: url,
      key: fileName,
      provider: 'local'
    };
  }

  async deleteFile(fileKey, provider) {
    try {
      switch (provider) {
        case 'aws':
          return await this.deleteFromAWS(fileKey);
        case 'gcp':
          return await this.deleteFromGCP(fileKey);
        case 'azure':
          return await this.deleteFromAzure(fileKey);
        case 'local':
        default:
          return await this.deleteFromLocal(fileKey);
      }
    } catch (error) {
      logger.error(`Delete failed for provider ${provider}:`, error);
      throw error;
    }
  }

  async deleteFromAWS(fileKey) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey
    });

    await this.s3.send(command);
    return true;
  }

  async deleteFromGCP(fileKey) {
    const file = this.bucket.file(fileKey);
    await file.delete();
    return true;
  }

  async deleteFromAzure(fileKey) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileKey);
    await blockBlobClient.delete();
    return true;
  }

  async deleteFromLocal(fileKey) {
    const filePath = path.join(this.uploadDir, fileKey);
    await fs.unlink(filePath);
    return true;
  }

  async getFileUrl(fileKey, provider) {
    switch (provider) {
      case 'aws':
        return `https://${this.bucketName}.s3.amazonaws.com/${fileKey}`;
      case 'gcp':
        const file = this.bucket.file(fileKey);
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '01-01-2100'
        });
        return url;
      case 'azure':
        const blockBlobClient = this.containerClient.getBlockBlobClient(fileKey);
        return blockBlobClient.url;
      case 'local':
      default:
        // Determine the correct base URL
    let baseUrl;
    if (process.env.BASE_URL) {
      baseUrl = process.env.BASE_URL;
    } else if (process.env.RENDER_EXTERNAL_URL) {
      baseUrl = process.env.RENDER_EXTERNAL_URL;
    } else if (process.env.NODE_ENV === 'production') {
      baseUrl = 'https://qorscend-backend.onrender.com';
    } else {
      baseUrl = 'http://localhost:5000';
    }
        return `${baseUrl}/uploads/${fileKey}`;
    }
  }

  // Quantum-specific file format support
  async processQuantumFile(fileBuffer, fileName, contentType) {
    const supportedFormats = [
      'application/json',
      'text/csv',
      'application/x-python-code',
      'text/plain'
    ];

    if (!supportedFormats.includes(contentType)) {
      throw new Error(`Unsupported file format: ${contentType}. Supported formats: ${supportedFormats.join(', ')}`);
    }

    // Validate quantum-specific content
    if (contentType === 'application/json') {
      try {
        const content = JSON.parse(fileBuffer.toString());
        this.validateQuantumJSON(content);
      } catch (error) {
        throw new Error('Invalid quantum JSON format');
      }
    }

    return true;
  }

  validateQuantumJSON(content) {
    // Basic validation for quantum experiment data
    const requiredFields = ['experiment', 'results', 'metadata'];
    const hasRequiredFields = requiredFields.some(field => content.hasOwnProperty(field));
    
    if (!hasRequiredFields) {
      throw new Error('Invalid quantum experiment data format');
    }
  }
}

module.exports = new CloudStorageService(); 