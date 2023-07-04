import {SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import type  { RouterOutputs } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from 'superjson';
import { prisma } from "~/server/db";
import { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import { PageLayout } from "~/components/layout";



const ProfilePage: NextPage<{username: string}> = ({username}) => {

  const {data} = api.profile.getUserByUsername.useQuery({
    username,
  });
  

  if(!data) return <div>404</div>

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        {/* If we want to have a background image, we would set it here */}
        <div className="relative h-48 bg-blue-850">
          <Image
            src={data.profileImageUrl} 
            alt={`@${data.username}'s profile picture`} 
            width={120}
            height={120}

            className="absolute bottom-0 left-0 -mb-[60px] ml-8 rounded-full
            border-4 border-black"
          />
        </div>
        <div className="h-[80px]"></div>
        <div className="p-4 text-2xl font-bold">
          {`@${data.username ?? ""}`}
        </div>
        <div className="border-b border-slate-400 w-full" />
        
      </PageLayout>
    </>
  );
};

export default ProfilePage;


export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {prisma, userId: null},
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;
  
  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({username: slug});


  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
}

export const getStaticPaths = () => {
  return {paths: [], fallback: "blocking"};
};


