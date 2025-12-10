/**
 * LazyImage Component
 *
 * 图片懒加载组件
 * 使用 Intersection Observer 在图片进入视口时才加载
 */

import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';

// ============ Types ============

export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** 图片源 */
  src: string;
  /** 占位图 */
  placeholder?: string;
  /** 加载失败时的备用图 */
  fallback?: string;
  /** 提前加载的距离 (px) */
  rootMargin?: string;
  /** 是否禁用懒加载 */
  eager?: boolean;
  /** 淡入动画时长 (ms) */
  fadeInDuration?: number;
  /** 加载完成回调 */
  onLoad?: () => void;
  /** 加载失败回调 */
  onError?: () => void;
}

// ============ Constants ============

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';

// ============ Component ============

/**
 * 懒加载图片组件
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src={user.avatar}
 *   alt={user.name}
 *   className="w-10 h-10 rounded-full"
 *   fallback="/default-avatar.png"
 * />
 * ```
 */
export function LazyImage({
  src,
  alt,
  placeholder = DEFAULT_PLACEHOLDER,
  fallback,
  rootMargin = '100px',
  eager = false,
  fadeInDuration = 200,
  onLoad,
  onError,
  className = '',
  style,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // ============ Intersection Observer ============

  useEffect(() => {
    if (eager || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [eager, rootMargin]);

  // ============ Event Handlers ============

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // ============ Computed Values ============

  const currentSrc = hasError && fallback ? fallback : isInView ? src : placeholder;

  const imageStyle: React.CSSProperties = {
    ...style,
    opacity: isLoaded || !isInView ? 1 : 0,
    transition: fadeInDuration > 0 ? `opacity ${fadeInDuration}ms ease-in-out` : undefined,
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={className}
      style={imageStyle}
      onLoad={handleLoad}
      onError={handleError}
      loading={eager ? 'eager' : 'lazy'}
      {...props}
    />
  );
}

// ============ Avatar Variant ============

export interface LazyAvatarProps extends Omit<LazyImageProps, 'fallback'> {
  /** 用户名 (用于生成默认头像) */
  name?: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AVATAR_SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * 懒加载头像组件
 *
 * @example
 * ```tsx
 * <LazyAvatar
 *   src={user.avatar}
 *   name={user.name}
 *   size="md"
 * />
 * ```
 */
export function LazyAvatar({
  src,
  name = '',
  size = 'md',
  className = '',
  ...props
}: LazyAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // 根据名字生成一致的颜色
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  const [hasError, setHasError] = useState(false);
  const sizeClass = AVATAR_SIZES[size];

  if (!src || hasError) {
    // 显示首字母头像
    return (
      <div
        className={`${sizeClass} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium ${className}`}
        title={name}
        {...(props as any)}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <LazyImage
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

// ============ Background Image Variant ============

export interface LazyBackgroundProps {
  /** 图片源 */
  src: string;
  /** 占位图 */
  placeholder?: string;
  /** 子元素 */
  children?: React.ReactNode;
  /** 类名 */
  className?: string;
  /** 提前加载距离 */
  rootMargin?: string;
  /** 样式 */
  style?: React.CSSProperties;
}

/**
 * 懒加载背景图组件
 */
export function LazyBackground({
  src,
  placeholder = DEFAULT_PLACEHOLDER,
  children,
  className = '',
  rootMargin = '100px',
  style,
}: LazyBackgroundProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [rootMargin]);

  // 预加载图片
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  const bgStyle: React.CSSProperties = {
    ...style,
    backgroundImage: `url(${isLoaded ? src : placeholder})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'background-image 0.3s ease-in-out',
  };

  return (
    <div ref={containerRef} className={className} style={bgStyle}>
      {children}
    </div>
  );
}

export default LazyImage;
