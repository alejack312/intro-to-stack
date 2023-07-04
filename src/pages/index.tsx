import {SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

import Head from "next/head";

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


  console.log(user);  

  //If no user, return null for now
  if(!user) return null;


  //By this point we should have a user because we checked above
  return (
    <div className="flex w-full gap-4">
      <Image 
        src={user.profileImageUrl} 
        alt="Profile image" 
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
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

  if (postsLoading) return <LoadingPage />;

  

  if(!data) return <div>Something went wrong...</div>;

  return (
    /*Keys are a way that react uses to identify what should or shouldn't 
      be updated. Keep amount of time to render down slightly */

    <div className="flex flex-col">
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
    </PageLayout>
  );
}
