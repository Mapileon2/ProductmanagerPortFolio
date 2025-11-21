import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CarouselImage } from '../types';

const Carousel: React.FC = () => {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<CarouselImage | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const fetchedImages = await api.getCarouselImages();
                setImages(fetchedImages);
            } catch (error) {
                console.error('Failed to fetch carousel images:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchImages();
    }, []);

    useEffect(() => {
        if (images.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => 
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                );
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [images.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
    };

    const handleImageClick = (image: CarouselImage) => {
        setZoomedImage(image);
        setIsZoomed(true);
    };

    const closeZoom = () => {
        setIsZoomed(false);
        setZoomedImage(null);
    };

    // Keyboard navigation for zoom
    useEffect(() => {
        if (!isZoomed) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeZoom();
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isZoomed]);

    if (isLoading) {
        return (
            <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No carousel images available</p>
            </div>
        );
    }

    return (
        <>
            {/* Zoom Modal */}
            {isZoomed && zoomedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center p-4"
                    onClick={closeZoom}
                >
                    {/* Close button */}
                    <button
                        onClick={closeZoom}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                        aria-label="Close zoom"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    {/* Zoomed Image */}
                    <div className="max-w-7xl max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={zoomedImage.src} 
                            alt={zoomedImage.title}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="mt-4 text-center text-white">
                            <h3 className="text-2xl font-bold ghibli-font mb-2">{zoomedImage.title}</h3>
                            <p className="text-lg opacity-90">{zoomedImage.description}</p>
                        </div>
                    </div>
                    
                    {/* Hint */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-75">
                        Click anywhere or press ESC to close
                    </div>
                </div>
            )}

            <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl group">
                {/* Images */}
                <div className="relative w-full h-full bg-gray-900">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${
                                index === currentIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <div 
                                className="relative w-full h-full cursor-zoom-in"
                                onClick={() => handleImageClick(image)}
                            >
                                <img
                                    src={image.src}
                                    alt={image.title}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    decoding="async"
                                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                                    style={{
                                        objectFit: 'contain',
                                        objectPosition: 'center'
                                    }}
                                />
                                {/* Zoom icon hint */}
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                            
                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white pointer-events-none">
                                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 ghibli-font drop-shadow-lg">
                                    {image.title}
                                </h3>
                                <p className="text-base md:text-lg opacity-90 drop-shadow-md">
                                    {image.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all duration-200 text-white hover:scale-110 z-10"
                            aria-label="Previous image"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all duration-200 text-white hover:scale-110 z-10"
                            aria-label="Next image"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots Indicator */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                                    index === currentIndex
                                        ? 'bg-white scale-125 shadow-lg'
                                        : 'bg-white/50 hover:bg-white/75'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Carousel;