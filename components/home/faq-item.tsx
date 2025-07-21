import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/home/ui/accordion";
import { cn } from "@/lib/utils";

interface FaqItemProps {
  question: string;
  answer: string;
  className?: string;
}

export function FaqItem({ question, answer, className }: FaqItemProps) {
  return (
    <AccordionItem value={question} className={cn("border-b-0", className)}>
      <AccordionTrigger className="py-6 text-left text-lg hover:no-underline">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-lg text-[#788287]">{answer}</AccordionContent>
    </AccordionItem>
  );
}
