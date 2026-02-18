import Image from 'next/image';

interface CharacterImageProps {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  className?: string;
}

const sizeMap = {
  small: 'text-3xl w-12 h-12',
  medium: 'text-4xl w-16 h-16',
  large: 'text-6xl w-24 h-24',
  xlarge: 'text-8xl w-32 h-32',
  xxlarge: 'text-9xl w-48 h-48',
};

export function CharacterImage({ src, alt, size = 'medium', className = '' }: CharacterImageProps) {
  // Détecte si c'est un emoji (commence pas par / ou http)
  const isEmoji = !src.startsWith('/') && !src.startsWith('http');
  
  if (isEmoji) {
    // Afficher l'emoji
    return (
      <div className={`${sizeMap[size]} ${className} flex items-center justify-center`}>
        {src}
      </div>
    );
  }
  
  // Afficher l'image
  const [width, height] = (() => {
    switch (size) {
      case 'small': return [48, 48];
      case 'medium': return [64, 64];
      case 'large': return [96, 96];
      case 'xlarge': return [128, 128];
      case 'xxlarge': return [192, 192];
      default: return [64, 64];
    }
  })();
  
  return (
    <div className={`${className} relative`} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover rounded-lg"
        sizes={`${width}px`}
      />
    </div>
  );
}
