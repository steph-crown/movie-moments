import Image from "next/image";

import { CarouselItem } from "@/components/home/ui/carousel";
import { Card, CardContent } from "@/components/home/ui/card";
import { cn } from "@/lib/utils";

interface CarouselTestimonialCardProps {
  name: string;
  username: string;
  image: string;
  text: string;
  className?: string;
}

export function CarouselTestimonialCard({
  name,
  username,
  image,
  text,
  className,
}: CarouselTestimonialCardProps) {
  return (
    <CarouselItem className={cn("md:basis-1/2 lg:basis-1/3", className)}>
      <div className="h-full p-1">
        <Card className="shadow-md h-full">
          <CardContent className="flex flex-col items-start gap-5 p-7">
            <div className="flex items-center gap-4">
              <div className="relative size-10">
                <Image alt="Picture" src={image} fill className="rounded-full object-cover" />
              </div>
              <div>
                <p className="font-semibold leading-none text-[#292929]">{name}</p>
                <p className="mt-1 leading-none text-[#788287]">@{username}</p>
              </div>
            </div>
            <p className="text-[#292929]">{text}</p>
          </CardContent>
        </Card>
      </div>
    </CarouselItem>
  );
}
