import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join, relative } from 'path';

export enum UploadImageType {
  PRODUCT = 'P',
  AVATAR = 'A',
}

function ensureDirectory(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function resolveUploadDirectory(type?: string): string {
  const normalizedType = (type ?? '').toUpperCase();

  if (normalizedType === UploadImageType.PRODUCT) {
    return join(process.cwd(), 'images', 'product');
  }

  if (normalizedType === UploadImageType.AVATAR) {
    return join(process.cwd(), 'images', 'avatar');
  }

  throw new BadRequestException(
    'Invalid type. Use P for product or A for avatar.',
  );
}

function createFileName(originalName: string): string {
  const extension = extname(originalName).toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
}

export function buildImagePublicUrl(absoluteFilePath: string): string {
  const relativePath = relative(process.cwd(), absoluteFilePath)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');

  return `/${relativePath}`;
}

export function getImageUploadOptions(
  defaultType?: UploadImageType,
): MulterOptions {
  return {
    storage: diskStorage({
      destination: (req, _file, cb) => {
        try {
          // Ưu tiên dùng defaultType truyền vào từ Controller.
          // Nếu không có, mới fallback về req.body hoặc req.query
          const type =
            defaultType || req.body?.type || (req.query?.type as string);

          const uploadDirectory = resolveUploadDirectory(type);
          ensureDirectory(uploadDirectory);
          cb(null, uploadDirectory);
        } catch (error) {
          cb(error as Error, '');
        }
      },
      filename: (_req, file, cb) => {
        cb(null, createFileName(file.originalname));
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(
          new BadRequestException('Only image files are allowed.'),
          false,
        );
      }

      cb(null, true);
    },
  };
}
