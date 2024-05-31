import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { MAX_AI_REQUESTS_FREE_COUNTS } from "@/constants";

export const getOrCreateUserData = async () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  let userData = await prismadb.userData.findUnique({
    where: {
      userId: userId,
    },
  });

  if (userData === null) {
    userData = await prismadb.userData.create({
      data: { userId: userId, aiRequestsCount: MAX_AI_REQUESTS_FREE_COUNTS },
    });
  }

  return userData;
};

export const decreaseAiRequestsCount = async () => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  const userData = await prismadb.userData.findUnique({
    where: {
      userId,
    },
  });

  if (userData && userData.aiRequestsCount > 0) {
    await prismadb.userData.update({
      where: {
        userId,
      },
      data: {
        aiRequestsCount: userData.aiRequestsCount - 1,
      },
    });
  } else {
    console.log("WARNING: failed to decrease ai requests count.");
  }
};

export const canMakeMoreAiRequests = async () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  let userData = await prismadb.userData.findUnique({
    where: {
      userId,
    },
  });

  if (userData && userData.aiRequestsCount > 0) {
    return true;
  } else {
    return false;
  }
};
