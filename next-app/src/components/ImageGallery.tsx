import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface ImageGalleryProps {
  images: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export const ImageGallery = ({ 
  images, 
  open, 
  onOpenChange,
  initialIndex = 0 
}: ImageGalleryProps) => {
  const [api, setApi] = useState<any>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <Carousel
          setApi={setApi}
          opts={{
            startIndex: initialIndex,
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="flex items-center justify-center p-4">
                  <img
                    src={image}
                    alt={`รูปที่ ${index + 1}`}
                    className="max-h-[70vh] w-auto object-contain rounded-lg"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
        <div className="text-center text-sm text-muted-foreground font-prompt">
          รูปที่ {(api?.selectedScrollSnap() ?? initialIndex) + 1} / {images.length}
        </div>
      </DialogContent>
    </Dialog>
  );
};
