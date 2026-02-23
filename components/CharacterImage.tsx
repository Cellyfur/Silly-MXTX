import Image from 'next/image';

interface CharacterImageProps {
    src: string;
    alt: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
    className?: string;
    crop?: 'full' | 'head';  // ← Nouveau : full = image complète, head = juste le haut
}

const sizeMap = {
    small: 'text-3xl w-12 h-12',
    medium: 'text-4xl w-16 h-16',
    large: 'text-6xl w-24 h-24',
    xlarge: 'text-8xl w-32 h-32',
    xxlarge: 'text-9xl w-[512px] h-[512px]',  // ← Encore plus grand (512px)
};

export function CharacterImage({ src, alt, size = 'medium', className = '', crop = 'full' }: CharacterImageProps) {
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
            case 'xxlarge': return [512, 512];
            default: return [64, 64];
        }
    })();

    // Pour le crop "head", on affiche une image plus grande mais on ne montre que le haut
    if (crop === 'head') {
        return (
            <div className={`${className} relative overflow-hidden rounded-lg`} style={{ width, height }}>
                <Image
                    src={src}
                    alt={alt}
                    width={width * 2}  // Image 2x plus grande
                    height={height * 2}
                    className="absolute"
                    style={{
                        top: 0,  // Aligné en haut
                        left: '50%',
                        transform: 'translateX(-50%)',  // Centré horizontalement
                        width: width * 1.5,  // 1.5x la taille pour voir plus de détails
                        height: 'auto'
                    }}
                    quality={100}
                    unoptimized
                />
            </div>
        );
    }

    // Image complète (mode normal)
    return (
        <div className={`${className} relative overflow-hidden rounded-lg`} style={{ width, height }}>
            <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
                sizes={`${width}px`}
                quality={100}
                priority
                unoptimized
                loading="eager"
            />
        </div>
    );
}