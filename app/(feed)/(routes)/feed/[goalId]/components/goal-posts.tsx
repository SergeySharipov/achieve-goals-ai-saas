"use client";

import { ElementRef, useEffect, useRef, useState } from "react";
import { Companion } from "@prisma/client";
import { GoalPost, GoalPostProps } from "./goal-post";

interface GoalPostsProps {
  goalPosts: GoalPostProps[];
  isLoading: boolean;
  companion: Companion;
}

export const GoalPosts = ({
  goalPosts = [],
  isLoading,
  companion,
}: GoalPostsProps) => {
  const scrollRef = useRef<ElementRef<"div">>(null);

  const [fakeLoading, setFakeLoading] = useState(
    goalPosts.length === 0 ? true : false,
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFakeLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [goalPosts]);

  return (
    <div className="flex-1 overflow-y-auto pr-4">
      <GoalPost
        isLoading={fakeLoading}
        src={companion.src}
        role="system"
        content={`Hello, I am ${companion.name}, ${companion.description}`}
      />
      {goalPosts.map((goalPost) => (
        <GoalPost
          key={goalPost.id}
          src={companion.src}
          content={goalPost.content}
          role={goalPost.role}
          isLoading={goalPost.isLoading}
        />
      ))}
      <div ref={scrollRef} />
    </div>
  );
};
