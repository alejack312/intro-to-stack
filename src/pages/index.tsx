import {SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";


import { api } from "~/utils/api";


import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import {toast} from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";


const CreatePostWizard = () => {
  //Get user info
  const {user} = useUser();

  const [input, setInput] = useState("");

  //When we post, we wanted to update the post on the screen. To do this, we 
  //grab the context of the whole TRPC cache through the api context call.
  const ctx = api.useContext();

  const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    //When a user hits post, we clear the text box
    onSuccess: () => {
      setInput("");
      //Updating feed when post gets posted.
      void ctx.posts.getAll.invalidate();
    },

    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if(errorMessage && errorMessage[0]){
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please write something or try again later.");
      }
      
    },
  });



  //If no user, return null for now
  if(!user) return null;


  //By this point we should have a user because we checked above
  return (  
    <div className="flex w-full gap-4">
      <UserButton appearance={{
        elements: {
          userButtonAvatarBox: {
            width: 56,
            height: 56
          }
        }
      }} />
      <input 
        placeholder="Let us know what you think!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({content: input});
            }
          }
        }}
        // Wanna make sure input is disabled while a post is occuring
        disabled={isPosting}
      />
    {input !== "" && !isPosting && (
      <button onClick={() => mutate({content: input})} disabled={isPosting}> 
        Post 
      </button> 
    )}

    {isPosting && (
      <div className="flex items-center justify-center">
        <LoadingSpinner size={20}/>
      </div>
    )}
  </div>
  );
};



const Feed = () => {
  const {data, isLoading: postsLoading} = api.posts.getAll.useQuery();

  if (postsLoading)
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );
  

  if(!data) return <div>Something went wrong...</div>;

  return (
    /*Keys are a way that react uses to identify what should or shouldn't 
      be updated. Keep amount of time to render down slightly */

    <div className="flex grow flex-col overflow-y-scroll">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id}/>
      ))}
    </div>
  )

}

export default function Home() {

  const {isLoaded: userLoaded, isSignedIn} = useUser();

  /*
  Can bring us to the backend code from the frontend

  Two different files, run in two different places. One runs on the user's
  device. The other runs on our servers. We can go back and forth between the
  two like they are on the same machine.
  */

  //Start fetching ASAP
  api.posts.getAll.useQuery();
  
  //Return empty div if user isn't loaded
  if(!userLoaded) return <div />

  
  return (
    <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
          {!isSignedIn && (
            <div className="flex justify-center"> 
              <SignInButton/> 
            </div>
          )}

          {isSignedIn && <CreatePostWizard/>}
        </div>

        <Feed />

        <div className="flex items-center justify-between p-4 text-xl">
        <a href="www.theouttapocketpodcast.com">
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="https://theouttapocketpodcast.files.wordpress.com/2022/09/outta-pocket.jpg?w=300"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <div>TOPP</div>
          </div>
        </a>
        <span>
          <a href="www.theouttapocketpodcast.com">YouTube</a>
        </span>
      </div>

    </PageLayout>
  );
}
