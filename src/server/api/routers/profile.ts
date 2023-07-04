
import type { User } from "@clerk/nextjs/dist/types/api";
import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";

import { RouterOutputs } from "~/utils/api";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";


export const profileRouter = createTRPCRouter({
    getUserByUsername: publicProcedure
        .input(z.object({username: z.string()}))
        .query(async ({input}) => {
        const [user] = await clerkClient.users.getUserList({
            username: [input.username],
        });

        if (!user) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "User not found",
            });
        }

        return filterUserForClient(user);
    })
});
