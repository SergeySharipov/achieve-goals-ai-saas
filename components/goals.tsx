import Image from "next/image";
import Link from "next/link";
import { Goal } from "@prisma/client";

import { Card, CardFooter, CardHeader } from "@/components/ui/card";

interface GoalsProps {
  goals?: Goal[];
}

export const Goals = ({ goals }: GoalsProps) => {
  if (!goals || goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 pt-10">
        <div className="relative h-60 w-60">
          <Image fill className="grayscale" src="/empty.png" alt="Empty" />
        </div>
        <p className="text-sm text-muted-foreground">No goals found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 pb-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {goals.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer rounded-xl border-0 bg-primary/10 transition hover:opacity-75"
        >
          <Link href={`/chat/${item.id}`}>
            <CardHeader className="flex items-center justify-center text-center text-muted-foreground">
              <p className="font-bold">{item.title}</p>
              <p className="text-xs">{item.description}</p>
            </CardHeader>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
              <p className="lowercase">@{item.goalStatus}</p>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  );
};
