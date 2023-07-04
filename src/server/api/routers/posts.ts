

import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { RouterOutputs } from "~/utils/api";
import { TRPCError } from "@trpc/server";



import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import { Post } from "@prisma/client";


const addUserDataToPosts = async (posts: Post []) => {
    //We need more data, specifically, the user profile image url. We will use
    //the clerk client
    const users = (
        await clerkClient.users.getUserList({
            userId: posts.map((post) => post.authorId),
            limit: 100,
        })
    ).map(filterUserForClient);

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
        };
    });
}

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});

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

    return addUserDataToPosts(posts);

  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async({ ctx, input }) => {
        const post = await ctx.prisma.post.findUnique({
            where: {id: input.id},
        });

        if (!post) throw new TRPCError({code: "NOT_FOUND"});

        return (await addUserDataToPosts([post]))[0]; 
  }),


  getPostsByUserId: publicProcedure
    .input(
        z.object({
            userId: z.string(),
        })
    )
    .query(({ctx, input}) => 
        ctx.prisma.post
            .findMany({
                where: {
                    authorId: input.userId,
                },
                take: 100,
                orderBy: [{createdAt: "desc"}],
            })
            .then(addUserDataToPosts)
    ),


  //Guarantees user is authenticated

  //Zod: Use to type-check data essentially
  create: privateProcedure.input(
    z.object({
        content: z.string().min(3, { message: "Post must be 3 or more characters long." }).max(500),
    })).mutation(async({ctx, input}) => {
    const authorId = ctx.userId;

    
    const {success} = await ratelimit.limit(authorId);
    if(!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});

    const post = await ctx.prisma.post.create({
        data: {
            authorId,
            content: input.content,
        },
    });
    return post;
  }),
});
