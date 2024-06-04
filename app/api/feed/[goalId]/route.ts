import dotenv from "dotenv";
import { StreamingTextResponse, LangChainStream } from "ai";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { ChatOpenAI } from "@langchain/openai";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import {
  canMakeMoreAiRequests,
  decreaseAiRequestsCount,
} from "@/lib/user-data";
import { checkSubscription } from "@/lib/subscription";

dotenv.config({ path: `.env` });

export async function POST(
  request: Request,
  { params }: { params: { goalId: string } },
) {
  const { prompt, stressLevel } = await request.json();
  const user = await currentUser();

  if (!user || !user.firstName || !user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isPro = await checkSubscription();

  if (!isPro) {
    const canMakeMoreAiRequestsResp = await canMakeMoreAiRequests();

    if (!canMakeMoreAiRequestsResp) {
      return new NextResponse("Premium subscription is required", {
        status: 402,
      });
    }
  }

  let goal = await prismadb.goal.update({
    where: {
      id: params.goalId,
    },
    data: {
      goalPosts: {
        create: {
          content: prompt,
          role: "user",
          postType: "progress",
          userId: user.id,
        },
      },
    },
    include: {
      stressLevels: true,
    },
  });

  if (!goal) {
    return new NextResponse("Goal not found", { status: 404 });
  }

  let companion = await prismadb.companion.findUnique({
    where: {
      id: goal.companionId,
    },
  });

  if (!companion) {
    return new NextResponse("Companion not found", { status: 404 });
  }

  const { handlers } = LangChainStream();

  const openai = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    callbackManager: CallbackManager.fromHandlers(handlers),
  });

  // Turn verbose on for debugging
  openai.verbose = true;

  const resp = await openai
    .invoke(
      ` 
        Main user message: {
          My plan: ${prompt}
          Can you give me specific tips on how to improve my plan or how to prepare, considering my goals?
        }

        Below are relevant details about user, use it to answer main user message and give encouragement based on the user's stress level and overall goal.
        General user information: {
          Main Goal: {
            Title: ${goal.title}
            Reasons: ${goal.reasons}
            Accomplish Criteria: ${goal.accomplishCriteria}
          }
        }
        `,
    )
    .catch(console.error);

  const content = resp?.content as string;

  if (!content && content?.length < 1) {
    return new NextResponse("content not found", { status: 404 });
  }

  var Readable = require("stream").Readable;
  let s = new Readable();
  s.push(content);
  s.push(null);

  await prismadb.goal.update({
    where: {
      id: params.goalId,
    },
    data: {
      goalPosts: {
        create: {
          content: content,
          role: "system",
          postType: "progress",
          userId: user.id,
        },
      },
    },
  });

  if (!isPro) {
    await decreaseAiRequestsCount();
  }

  return new StreamingTextResponse(s);
}
