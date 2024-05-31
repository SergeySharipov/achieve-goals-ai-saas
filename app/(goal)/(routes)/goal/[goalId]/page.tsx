import { redirect } from "next/navigation";
import { auth, redirectToSignIn } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

import { GoalClient } from "./components/client";

interface GoalIdPageProps {
  params: {
    goalId: string;
  };
}

const GoalIdPage = async ({ params }: GoalIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const goal = await prismadb.goal.findUnique({
    where: {
      id: params.goalId,
    },
    include: {
      goalPosts: {
        orderBy: {
          createdAt: "asc",
        },
        where: {
          userId,
        },
      },
    },
  });

  if (goal?.companionId == null) {
    return redirect("/");
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: goal.companionId,
    },
  });

  if (!companion) {
    return redirect("/");
  }

  return <GoalClient goal={goal} companion={companion} />;
};

export default GoalIdPage;
