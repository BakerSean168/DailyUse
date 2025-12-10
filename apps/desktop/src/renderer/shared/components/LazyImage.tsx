/**
 * LazyImage Component
 *
 * Provides a performant image component that lazily loads images when they enter the viewport.
 * Uses the Intersection Observer API for efficient visibility detection.
 * Includes variants for Avatars and Background Images.
 *
 * @module renderer/shared/components/LazyImage
 */

import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react';

// ============ Types ============

/**
 * Props for the LazyImage component.
 */
export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** The source URL of the image. */
  src: string;
  /** URL for a placeholder image (e.g., a tiny blurry version) displayed while loading. */
  placeholder?: string;
  /** URL for a fallback image if the main image fails to load. */
  fallback?: string;
  /** Margin around the root to start loading before the image enters viewport (default: '100px'). */
  rootMargin?: string;
  /** If true, disables lazy loading and loads immediately (default: false). */
  eager?: boolean;
  /** Duration of the fade-in animation in milliseconds (default: 200). */
  fadeInDuration?: number;
  /** Callback fired when the image successfully loads. */
  onLoad?: () => void;
  /** Callback fired when the image fails to load. */
  onError?: () => void;
}

// ============ Constants ============

/** Default gray placeholder SVG. */
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';

// ============ Component ============

/**
 * A drop-in replacement for the `<img>` tag that supports lazy loading and placeholders.
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

/**
 * Props for the LazyAvatar component.
 */
export interface LazyAvatarProps extends Omit<LazyImageProps, 'fallback'> {
  /** The name of the user/entity to generate initials if image fails. */
  name?: string;
  /** Preset size of the avatar. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AVATAR_SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * Specialized LazyImage for user avatars.
 * Automatically handles fallbacks by generating initials on a colored background.
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

  // Generate a consistent color based on the name string
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
    // Render initials fallback
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

/**
 * Props for LazyBackground component.
 */
export interface LazyBackgroundProps {
  /** The source URL of the background image. */
  src: string;
  /** URL for a placeholder image. */
  placeholder?: string;
  /** Child elements to render inside the container. */
  children?: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
  /** Margin around the root to start loading. */
  rootMargin?: string;
  /** Inline styles. */
  style?: React.CSSProperties;
}

/**
 * A container that lazily loads its background image.
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

  // Preload image object
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
