import { cn } from "@/lib/utils";

interface GrainifyProps {
  className?: string;
}

export function Grainify({ className }: GrainifyProps) {
  return (
    <div className={cn("inset-0 absolute pointer-events-none", className)}>
      <div
        className="w-full h-full relative z-[-1] opacity-20"
        style={{
          backgroundImage:
            "url('https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/assets/grainy_bff64ec0-188d-4aab-b496-566eb94b2b84.svg')",
          backgroundSize: "300px",
        }}
      />
    </div>
  );
}
