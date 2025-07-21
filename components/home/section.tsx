import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/home/badge";
import { Gradient } from "@/components/home/gradient";
import { Grainify } from "@/components/home/grainify";
import { Button } from "@/components/home/ui/button";
import Link from "next/link";
import { Quote } from "../quote";
import { Logo } from "../logo";

export function Section() {
  return (
    <main className="container space-y-4 p-4 mx-auto !max-w-[1200px]">
      <section className="w-full flex flex-col rounded-3xl bg-[#6365F1] text-[#F8FAFC] relative isolate overflow-hidden sm:gap-y-16 gap-y-8 md:p-12 p-6">
        <Grainify className="opacity-25" />
        <div className="bg-[rgba(255,255,255,0)] bg-[linear-gradient(#eaeaea_1.2px,_transparent_1.2px),_linear-gradient(to_right,_#eaeaea_1.2px,_rgba(255,255,255,0)_1.2px)] bg-[length:24px_24px] absolute inset-0 rounded-3xl -z-[1] opacity-10 [clip-path:circle(40%)]" />
        <div className="flex justify-between items-center">
          {/* <Image
            alt="Image"
            src="/images/reweb-logo.png"
            width={500}
            height={500}
            className="size-12 rounded-full"
          /> */}
          <Logo color="white" />

          <Link href="/auth/login" className="block">
            <Button className="rounded-[0.625rem] bg-white hover:bg-white/80 text-[#6366f1]">
              Login
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center gap-y-8">
          <h2 className="font-inter font-semibold tracking-tight text-balance sm:text-8xl text-center text-5xl">
            Share Every Movie Moment
          </h2>
          <h1 className="text-center text-pretty text-lg max-w-md">
            You know that feeling when something incredible happens in a movie
            and you just need to tell someone? Now you can share those reactions
            at the exact timestamp with friends, even if they&apos;re watching
            weeks later.
          </h1>
        </div>

        <Link href="/auth/signup" className="block mx-auto w-max">
          <Button className="mx-auto rounded-[0.625rem] text-[#6366f1] bg-white hover:bg-white/80">
            Start sharing moments
          </Button>
        </Link>
      </section>
      <section className="w-full flex flex-col rounded-3xl relative isolate gap-y-8 bg-[#F1F1FE] text-[#0A0A0A] overflow-hidden md:p-12 p-6">
        <Grainify />
        <Gradient className="absolute right-0" />
        <Badge text="THE STORY" />
        <div className="flex flex-col gap-y-8">
          <h2 className="font-inter tracking-tight text-balance text-5xl font-light sm:text-7xl">
            A Simple Wish
          </h2>
        </div>
        {/* <Image
          alt="Image"
          src="/images/Note.png"
          width={800}
          height={500}
          className="mx-auto shadow-md rounded-2xl"
        /> */}

        <Quote />
      </section>
      <section className="w-full flex flex-col rounded-3xl relative isolate gap-y-8 bg-[#F1F1FE] text-[#0A0A0A] overflow-hidden md:p-12 p-6">
        <Grainify />
        <Gradient className="absolute bottom-0 translate-y-1/2" />
        <div className="bg-[length:12px_12px] opacity-70 absolute inset-0 -z-[1] translate-x-1/2 -translate-y-1/2 [clip-path:ellipse(50%_50%_at_50%_50%)] bg-[linear-gradient(0deg,_rgba(255,255,255,0)_50%,_#D8E1E9_50%)]" />
        <Badge text="FEATURES" />
        <div className="flex flex-col gap-y-8">
          <h2 className="font-inter tracking-tight text-balance text-5xl font-light sm:text-7xl">
            For Movie Enthusiasts
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
          <div className="space-y-8">
            <div className="p-8 rounded-2xl bg-background shadow-md">
              <h3 className="font-inter text-2xl font-bold mb-4">
                Instant Moment Capture
              </h3>
              <p className="text-[#788287]">
                Create timestamp discussions in seconds. Just enter the movie
                and timestamp to share reactions that friends can discover
                exactly when they reach that same moment.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-background shadow-md">
              <h3 className="font-inter text-2xl font-bold mb-4">
                Universal Compatibility
              </h3>
              <p className="text-[#788287]">
                Works with any movie or series, regardless of where you&apos;re
                watching. Share moments from your favorite films and shows
                without being tied to specific services.
              </p>
            </div>
          </div>
          <div className="p-8 rounded-2xl flex flex-col justify-between bg-background shadow-md">
            <div className="flex flex-col">
              <h3 className="font-inter text-2xl font-bold mb-4">
                Smart Spoiler Protection
              </h3>
              <p className="text-[#788287] mb-6">
                Automatically hides reactions from future scenes and episodes.
                Friends see your thoughts exactly when they want to, creating
                perfect spoiler-free discovery.
              </p>
            </div>

            <Link href="/auth/signup" className="block">
              <Button className="rounded-[0.625rem] bg-[#6366f1] !w-full">
                Start sharing moments
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* <section
        id="solutions"
        className="w-full flex flex-col rounded-3xl relative isolate gap-y-8 bg-[#F1F1FE] text-[#0A0A0A] overflow-hidden md:p-12 p-6"
      >
        <Grainify />
        <Gradient className="absolute top-0 -translate-y-1/2" />
        <Badge text="HOW IT WORKS" />
        <div className="flex flex-col sm:flex-row justify-between gap-x-16 gap-y-4">
          <h2 className="font-inter tracking-tight text-balance text-5xl font-light sm:text-7xl grow">
            Very Easy to Use
          </h2>
        </div>
        <Card className="overflow-hidden border-none shadow-md">
          <Tabs defaultValue="item-1">
            <div className="w-full overflow-auto grid bg-[#D8E1E9]">
              <TabsList className="mx-auto w-max flex-none inline-flex">
                <TabsTrigger value="item-1">Watch Your Movie</TabsTrigger>
                <TabsTrigger value="item-2">Create a Room</TabsTrigger>
                <TabsTrigger value="item-3">Share With Friends</TabsTrigger>
                <TabsTrigger value="item-4">
                  Friends Discover Your Reaction
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="item-1" className="mt-0">
              <div className="p-8 grid gap-8 bg-background mt-0 lg:grid-cols-2">
                <div className="flex flex-col gap-4 order-2 lg:order-none justify-center">
                  <h3 className="text-2xl font-bold font-inter">
                    Watch Your Movie
                  </h3>
                  <p className="text-[#788287]">
                    Enjoy your film on Netflix, Disney+, or any platform. When
                    something amazing happens, note the timestamp.
                  </p>

                  <Link href="/auth/signup">
                    <Button className="w-fit rounded-[0.625rem]">
                      Get started
                    </Button>
                  </Link>
                </div>
                <div className="relative rounded-xl overflow-hidden border">
                  <Image
                    alt="Research transparency visualization"
                    src="/images/annie-spratt-QckxruozjRg-unsplash.jpg"
                    width={500}
                    height={300}
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    placeholder="blur"
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="item-2" className="mt-0">
              <div className="p-8 grid gap-8 bg-background mt-0 lg:grid-cols-2">
                <div className="flex flex-col gap-4 order-2 lg:order-none justify-center">
                  <h3 className="text-2xl font-bold font-inter">
                    Create a Room
                  </h3>
                  <p className="text-[#788287]">
                    Head to MovieMoments and create a discussion room for that
                    exact timestamp. Add your reaction to that perfect moment.
                  </p>
                </div>
                <div className="relative rounded-xl overflow-hidden border">
                  <Image
                    alt="Research transparency visualization"
                    src="/images/ux-indonesia-w00FkE6e8zE-unsplash.jpg"
                    width={500}
                    height={300}
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    placeholder="blur"
                    className="size-full object-contain"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="item-3" className="mt-0">
              <div className="p-8 grid gap-8 bg-background mt-0 lg:grid-cols-2">
                <div className="flex flex-col gap-4 order-2 lg:order-none justify-center">
                  <h3 className="text-2xl font-bold font-inter">
                    Share With Friends
                  </h3>
                  <p className="text-[#788287]">
                    Get a shareable link and send it to your movie buddies. They
                    can join the discussion anytime.
                  </p>
                </div>
                <div className="relative rounded-xl overflow-hidden border">
                  <Image
                    alt="Research transparency visualization"
                    src="/images/markus-spiske-Skf7HxARcoc-unsplash.jpg"
                    width={500}
                    height={300}
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    placeholder="blur"
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="item-4" className="mt-0">
              <div className="p-8 grid gap-8 bg-background mt-0 lg:grid-cols-2">
                <div className="flex flex-col gap-4 order-2 lg:order-none justify-center">
                  <h3 className="text-2xl font-bold font-inter">
                    Friends Discover Your Reaction
                  </h3>
                  <p className="text-[#788287]">
                    When friends reach that exact timestamp, they&apos;ll see
                    your reaction and can respond. Perfect spoiler-free
                    discovery!
                  </p>
                </div>
                <div className="relative rounded-xl overflow-hidden border">
                  <Image
                    alt="Research transparency visualization"
                    src="/images/nasa-Q1p7bh3SHj8-unsplash.jpg"
                    width={500}
                    height={300}
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    placeholder="blur"
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </section> */}
      <section className="w-full flex flex-col rounded-3xl bg-[#6365F1] text-[#F8FAFC] relative isolate overflow-hidden gap-y-8 md:p-12 p-6">
        <Grainify className="opacity-25" />
        <div className="bg-[rgba(255,255,255,0)] bg-[linear-gradient(#eaeaea_1.2px,_transparent_1.2px),_linear-gradient(to_right,_#eaeaea_1.2px,_rgba(255,255,255,0)_1.2px)] bg-[length:24px_24px] absolute inset-0 rounded-3xl -z-[1] opacity-10 [clip-path:circle(40%)]" />
        <Image
          alt="Image"
          src="/images/SphereRingStandingL.png"
          width={400}
          height={400}
          className="absolute -z-[1] left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2"
        />
        <Badge text="Get started" className="bg-background mx-auto" />
        <div className="flex flex-col items-center gap-y-8">
          <h2 className="font-inter tracking-tight text-balance text-center text-5xl sm:text-7xl">
            Share Every Movie Moments
          </h2>
        </div>
        <Link href="/auth/signup" className="block mx-auto w-max">
          <Button className="mx-auto text-[#6366f1] bg-white rounded-[0.625rem]">
            Start sharing moments
          </Button>
        </Link>
      </section>

      <p className="mb-12 mt-4 text-center font-medium">
        For the love of movies. Built by{" "}
        <a
          href="https://stephcrown.com"
          className="text-primary font-semibold underline"
        >
          Stephen
        </a>{" "}
        &copy; {new Date().getFullYear()}{" "}
      </p>
    </main>
  );
}
