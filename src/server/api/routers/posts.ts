import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
    /*
    Gets all the posts for us. This does not need to be protected by user
    authetication because people should be able to see all posts from the home
    page without logging in.
    */
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany();
  }),
});
