/**
 * Resource Upload Service Tests
 * 资源上传服务单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fileToBase64,
  generateEmbedSyntax,
  getFileType,
} from '../ResourceUploadService';

describe('ResourceUploadService', () => {
  describe('fileToBase64', () => {
    it('should convert file to base64 string', async () => {
      const content = 'Hello, World!';
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });

      const result = await fileToBase64(file);

      expect(result).toMatch(/^data:text\/plain;base64,/);
      // Decode and verify content
      const base64Content = result.split(',')[1];
      const decoded = atob(base64Content);
      expect(decoded).toBe(content);
    });

    it('should handle image files', async () => {
      // Create a minimal PNG (1x1 transparent pixel)
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82,
      ]);
      const file = new File([pngData], 'test.png', { type: 'image/png' });

      const result = await fileToBase64(file);

      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      const result = await fileToBase64(file);

      expect(result).toBe('data:text/plain;base64,');
    });
  });

  describe('generateEmbedSyntax', () => {
    it('should generate image embed syntax', () => {
      const result = generateEmbedSyntax('photo.png', 'image');
      expect(result).toBe('![[photo.png]]');
    });

    it('should generate audio embed syntax', () => {
      const result = generateEmbedSyntax('music.mp3', 'audio');
      expect(result).toBe('![[music.mp3]]');
    });

    it('should generate video embed syntax', () => {
      const result = generateEmbedSyntax('video.mp4', 'video');
      expect(result).toBe('![[video.mp4]]');
    });

    it('should generate link syntax', () => {
      const result = generateEmbedSyntax('document.md', 'link');
      expect(result).toBe('[[document.md]]');
    });

    it('should generate markdown link for other types', () => {
      const result = generateEmbedSyntax('archive.zip', 'other');
      expect(result).toBe('[archive.zip](archive.zip)');
    });

    it('should handle filenames with special characters', () => {
      const result = generateEmbedSyntax('my file (1).png', 'image');
      expect(result).toBe('![[my file (1).png]]');
    });
  });

  describe('getFileType', () => {
    describe('image files', () => {
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'];
      
      imageExtensions.forEach(ext => {
        it(`should detect .${ext} as image`, () => {
          expect(getFileType(`photo.${ext}`)).toBe('image');
        });
      });

      it('should handle uppercase extensions', () => {
        expect(getFileType('photo.PNG')).toBe('image');
        expect(getFileType('photo.JPG')).toBe('image');
      });
    });

    describe('audio files', () => {
      const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'];
      
      audioExtensions.forEach(ext => {
        it(`should detect .${ext} as audio`, () => {
          expect(getFileType(`music.${ext}`)).toBe('audio');
        });
      });
    });

    describe('video files', () => {
      const videoExtensions = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'wmv'];
      
      videoExtensions.forEach(ext => {
        it(`should detect .${ext} as video`, () => {
          expect(getFileType(`video.${ext}`)).toBe('video');
        });
      });
    });

    describe('PDF files', () => {
      it('should detect .pdf as pdf', () => {
        expect(getFileType('document.pdf')).toBe('pdf');
      });

      it('should handle uppercase PDF', () => {
        expect(getFileType('document.PDF')).toBe('pdf');
      });
    });

    describe('other files', () => {
      it('should detect unknown extensions as other', () => {
        expect(getFileType('file.xyz')).toBe('other');
        expect(getFileType('archive.zip')).toBe('other');
        expect(getFileType('document.docx')).toBe('other');
      });

      it('should handle files without extension', () => {
        expect(getFileType('README')).toBe('other');
      });

      it('should handle empty filename', () => {
        expect(getFileType('')).toBe('other');
      });

      it('should handle files with multiple dots', () => {
        expect(getFileType('my.photo.backup.png')).toBe('image');
        expect(getFileType('archive.tar.gz')).toBe('other');
      });
    });
  });
});
