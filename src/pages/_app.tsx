import { type AppType } from "next/app";
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>The Pocket</title>
        <meta name="description" content="We could all use a little time outside of The Pocket…" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster
        position="bottom-center" 
      />
      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
