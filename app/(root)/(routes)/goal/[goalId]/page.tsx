import { redirect } from "next/navigation";
import { auth, redirectToSignIn } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

import { GoalForm } from "./components/goal-form";

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

  const validSubscription = await checkSubscription();

  if (!validSubscription) {
    return redirect("/");
  }

  const goal = await prismadb.goal.findUnique({
    where: {
      id: params.goalId,
      userId,
    },
  });

  const companions = await prismadb.companion.findMany();

  return <GoalForm companions={companions} initialData={goal} />;
};

export default GoalIdPage;
