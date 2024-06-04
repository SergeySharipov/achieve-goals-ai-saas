import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await currentUser();
    const { title, description, reasons, accomplishCriteria, companionId } =
      body;

    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !description || !accomplishCriteria) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const isPro = await checkSubscription();

    if (!isPro) {
      return new NextResponse("Pro subscription required", { status: 403 });
    }

    const goal = await prismadb.goal.create({
      data: {
        userId: user.id,
        companionId: companionId,

        title,
        description,
        reasons,
        accomplishCriteria,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.log("[GOAL_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
