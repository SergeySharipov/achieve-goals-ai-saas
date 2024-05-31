import { Goals } from "@/components/goals";
import { SearchInput } from "@/components/search-input";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";

interface PageProps {
  searchParams: {
    title: string;
  };
}

const Page = async ({ searchParams }: PageProps) => {
  const { userId } = auth();

  let goals;
  if (userId) {
    goals = await prismadb.goal.findMany({
      where: {
        userId: userId,
        title: {
          contains: searchParams.title,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return (
    <div className="h-full space-y-2 p-4">
      <SearchInput />
      <Goals goals={goals} />
    </div>
  );
};

export default Page;
