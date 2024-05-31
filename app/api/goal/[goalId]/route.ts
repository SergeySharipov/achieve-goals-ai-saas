import dotenv from "dotenv";
import { StreamingTextResponse, LangChainStream } from "ai";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
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
  { params }: { params: { chatId: string } },
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
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
        id: params.chatId,
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
    });

    if (!goal) {
      return new NextResponse("Goal not found", { status: 404 });
    }

    let companion;

    if (!goal.companionId) {
      companion = await prismadb.companion.findFirst();

      goal = await prismadb.goal.update({
        where: {
          id: params.chatId,
        },
        data: {
          companionId: companion!.id,
        },
      });
    } else {
      companion = await prismadb.companion.findUnique({
        where: {
          id: goal.companionId,
        },
      });
    }

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

    // TODO add ${relevantHistory}
    // TODO add ${recentChatHistory}\n${companion.name}:
    const resp = await openai
      .invoke(
        `
        ${companion.instructions}

        Try to give responses that are straight to the point. 
        Below are relevant details about ${companion.name}'s past and the conversation you are in.
       
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
        id: params.chatId,
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
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
