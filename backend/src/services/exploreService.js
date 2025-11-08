import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// Get all the different presets in the Interviews table in the database
// Essentially, how the app works is, it has these presets, and the user can
// select the one they want to be interviewed in.
// don't need an include {} here because we're selecting everything
async function getExplorePresets() {
  const interviews = await prisma.interview.findMany({
    take: 10,
  });
  return interviews;
}

// Get a specific preset by its id. If a user selects a preset, we'll use this
// to get the data for the interview so they can see the stuff before they
// get their hands dirty! 

async function getExplorePresetById(id) {
  const interview = await prisma.interview.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      expectedDuration: true,
      type: true,
      description: true,
      prompt: true,
      topic: true,
    },
  });
  return interview;
}

export default {
  getExplorePresets, getExplorePresetById,
};