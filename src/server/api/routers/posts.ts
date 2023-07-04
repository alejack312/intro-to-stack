
import type { User } from "@clerk/nextjs/dist/types/api";
import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { RouterOutputs } from "~/utils/api";
import { TRPCError } from "@trpc/server";


const filterUserForClient = (user: User) => {
    return {
        id: user.id, 
        username: user.username, 
        profileImageUrl: user.profileImageUrl,
    };
};



export const postsRouter = createTRPCRouter({
    /*
    Gets all the posts for us. This does not need to be protected by user
    authetication because people should be able to see all posts from the home
    page without logging in.
    */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
        take: 100,
        orderBy: [{createdAt: "desc"}],
    });

    //We need more data, specifically, the user profile image url. We will use
    //the clerk client
    const users = (
        await clerkClient.users.getUserList({
            userId: posts.map((post) => post.authorId),
            limit: 100,
        })
    ).map(filterUserForClient);

    console.log(users);

    return posts.map((post) => {
        const author = users.find((user) => user.id == post.authorId);

        if(!author || !author.username) 
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Author for post not found",
            });
        return {
            post,
            author: {
                ...author,
                username: author.username,
            },
        }
    });
  }),

  //Guarantees user is authenticated

  //Zod: Use to type-check data essentially
  create: privateProcedure.input(
    z.object({
        content: z.string().min(1).max(500),
    })).mutation(async({ctx, input}) => {
    const authorId = ctx.userId;

    const post = await ctx.prisma.post.create({
        data: {
            authorId,
            content: input.content,
        },
    });
    return post;
  }),
});
