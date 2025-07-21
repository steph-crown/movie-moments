export function Quote() {
  return (
    <div
      className="relative max-w-[45rem] mx-auto bg-white border-[2.94px] border-[#000000] rounded-[10px] pt-8 pb-6 px-5 sm:px-7"
      style={{
        boxShadow: "5.88px 5.88px 0px #000",
      }}
    >
      {/* Purple top bar */}
      <div className="absolute left-0 top-0 w-full h-[28px] bg-[#C9B8F9] rounded-t-[8px] border-b-[2.94px] border-black" />
      {/* Cat avatar */}

      {/* <div className="absolute -top-6 left-4 w-14 h-14 rounded-full border-black bg-white overflow-hidden">
        <Image
          src="/cat-avatar.svg" // Place your cat image in public/
          alt="Cat"
          width={56}
          height={56}
          className="object-cover w-full h-full"
        />
      </div> */}

      {/* Paperclip */}
      <div className="absolute -top-3 right-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M17 7L7 17C5.89543 18.1046 4.10457 18.1046 3 17C1.89543 15.8954 1.89543 14.1046 3 13L13 3C14.1046 1.89543 15.8954 1.89543 17 3C18.1046 4.10457 18.1046 5.89543 17 7L7 17"
            stroke="#7C6B9C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* Content */}
      <div className="mt-2">
        <h2 className="font-bold text-md mb-4">THE INSPIRATION</h2>
        <p className="font-medium text-sm sm:text-base mb-4">
          You know that moment when something incredible happens in a movie and
          you just need to tell someone RIGHT NOW? It happens to me constantly.
          A plot twist that blows my mind, a detail I finally caught on my third
          watch, or just a scene that suddenly hits different.
        </p>
        <p className="font-medium text-sm sm:text-base mb-4">
          But here&apos;s what always bugged me. My friends watched it weeks
          ago. Or they&apos;re asleep. Or they haven&apos;t seen it yet.
          I&apos;m sitting there with this amazing moment and nobody to share it
          with.
        </p>
        <p className="font-medium text-sm sm:text-base mb-4">
          Last week I was watching this series and something clicked that
          connected back to episode 2. I literally paused the show and just
          stared at the screen. I wanted so badly to text someone about it, but
          how do you explain which exact moment without spoiling everything?
        </p>
        <p className="font-medium text-sm sm:text-base mb-4">
          Then I thought about YouTube. You can drop a comment at any timestamp
          and people instantly know what you&apos;re talking about. Someone
          watching the same video months later sees your comment pop up at the
          perfect moment.
        </p>
        <p className="font-medium text-sm sm:text-base mb-4">
          Why don&apos;t we have something like that for movies and shows?
        </p>
        <p className="font-medium text-sm sm:text-base">
          So I stopped wishing and started building. Now every time something
          amazing happens in a show, I don&apos;t have to keep it to myself. I
          can share it at the exact timestamp so my friends will discover it
          when they reach that same moment.
        </p>
      </div>
    </div>
  );
}
