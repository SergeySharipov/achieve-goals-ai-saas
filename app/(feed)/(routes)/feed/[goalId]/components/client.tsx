"use client";

import { useCompletion } from "ai/react";
import { FormEvent, useEffect, useState } from "react";
import { Companion, Goal, GoalPost } from "@prisma/client";
import { useRouter } from "next/navigation";

import { GoalPostForm } from "./goal-post-form";
import { GoalHeader } from "./goal-header";
import { GoalPosts } from "./goal-posts";
import { GoalPostProps } from "./goal-post";
import { useToast } from "@/components/ui/use-toast";

interface GoalClientProps {
  goal: Goal & {
    goalPosts: GoalPost[];
  };
  companion: Companion;
}

export const GoalClient = ({ goal, companion }: GoalClientProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [goalPosts, setGoalPosts] = useState<GoalPostProps[]>(
    goal.goalPosts,
  );

  useEffect(() => {
    setGoalPosts(goal.goalPosts);
  }, [goal, setGoalPosts]);

  const { input, isLoading, handleInputChange, handleSubmit, setInput } =
    useCompletion({
      api: `/api/feed/${goal.id}`,
      onFinish(prompt, completion) {
        setInput("");

        router.refresh();
      },
      onError(e) {
        setGoalPosts(goal.goalPosts);

        if (e.message == "Premium subscription is required") {
          toast({
            description:
              "You've reached your free request limit. A premium subscription is required to continue.",
            variant: "destructive",
          });
        } else {
          toast({
            description: "Something went wrong.",
            variant: "destructive",
          });
        }
      },
    });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const userMessage: GoalPostProps = {
      role: "user",
      content: input,
      id: "user" + new Date().toISOString(),
    };
    const systemMessage: GoalPostProps = {
      role: "system",
      isLoading: true,
      id: "system" + new Date().toISOString(),
    };
    setGoalPosts((current) => [...current, userMessage, systemMessage]);

    handleSubmit(e);
  };

  return (
    <div className="flex h-full flex-col space-y-2 p-4">
      <GoalHeader goal={goal} companion={companion} />
      <GoalPosts
        companion={companion}
        isLoading={isLoading}
        goalPosts={goalPosts}
      />
      <GoalPostForm
        isLoading={isLoading}
        input={input}
        handleInputChange={handleInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};
