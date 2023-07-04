import Image from "next/image";
import type  { RouterOutputs } from "~/utils/api";
import Link from "next/link";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";



dayjs.extend(relativeTime);

/*
Create another component for displaying posts on the feed.

Do not create new files for components until you KNOW you are going to need them
somewhere else.

Cool feature of tRPC: Rather than having to define the type for what the component takes,
we have the type from whatever getAll returns (look below). In the api, we have the helpers defined
We can make a type called PostWithUser and set it equal to RouterOutputs
*/
type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const {post, author} = props;

  return (
    <div key={post.id} className="flex  border-b border-slate-400 p-4 gap-3">
        <Image 
          src={author.profileImageUrl}
          alt={`@${author.username}'s profile picture`} 
          className="h-14 w-14 rounded-full"
          width={56}
          height={56}
        />
        <div className="flex flex-col">
          <div className="flex gap-1 text-slate-300">
            <Link href={`/@${author.username}`}> 
              <span> {`@${author.username}`} </span> 
            </Link>
            <Link href={`/post/${post.id}`}>
              <span className="font-thin"> 
                {` · ${dayjs(post.createdAt).fromNow()}`} 
              </span>
            </Link>
          </div>
            <span className="text-l">
              {post.content}
            </span>
        </div>
    </div>
  )
}