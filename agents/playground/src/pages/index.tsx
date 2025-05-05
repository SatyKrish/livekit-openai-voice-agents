import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import Head from "next/head";
import { useCallback, useEffect, useState, useMemo } from "react";

import { PlaygroundConnect } from "@/components/PlaygroundConnect";
import Playground from "@/components/playground/Playground";
import { PlaygroundToast } from "@/components/toast/PlaygroundToast";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionMode, useConnection } from "@/hooks/useConnection";
import { useToast } from "@/components/toast/ToasterProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const themeColors = [
  "cyan",
  "green",
  "amber",
  "blue",
  "violet",
  "rose",
  "pink",
  "teal",
];

export default function Home() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } =
    useConnection();
  
  const { config } = useConfig();
  const { toastMessage, setToastMessage } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    // Wait for authentication to complete
    if (status === "loading") return;
    
    // Set loading to false once authentication state is determined
    setIsLoading(false);

    // If authentication is required but user is not authenticated, redirect to sign-in
    if (status === "unauthenticated") {
      router.push('/auth/signin');
      return;
    }
    
    // Auto-connect if LIVEKIT_URL is set and we're authenticated (or auth is not required)
    if (process.env.NEXT_PUBLIC_LIVEKIT_URL && (status === "authenticated")) {
      connect("env").catch(error => {
        console.error("Failed to auto-connect:", error);
        setToastMessage({
          type: "error",
          message: "Failed to auto-connect: " + error.message
        });
      });
    }
  }, [status, router, connect, setToastMessage]);

  const handleConnect = useCallback(
    async (c: boolean, mode: ConnectionMode) => {
      c ? connect(mode) : disconnect();
    },
    [connect, disconnect]
  );

  const showPG = useMemo(() => {
    if (process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      return true;
    }
    if(wsUrl) {
      return true;
    }
    return false;
  }, [wsUrl]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex left-0 top-0 w-full h-full bg-black repeating-square-background items-center justify-center text-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={`relative flex flex-col w-screen h-screen overflow-hidden repeating-square-background bg-black`}
      >
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="fixed w-full top-4 flex justify-center z-50"
              initial={{ opacity: 0, translateY: -50 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -50 }}
            >
              <PlaygroundToast />
            </motion.div>
          )}
        </AnimatePresence>
        {showPG ? (
          <LiveKitRoom
            className="flex flex-col h-full w-full"
            serverUrl={wsUrl}
            token={token}
            connect={shouldConnect}
            onError={(e) => {
              setToastMessage({ message: e.message, type: "error" });
              console.error(e);
            }}
          >
            <Playground
              themeColors={themeColors}
              onConnect={(c) => {
                const m = process.env.NEXT_PUBLIC_LIVEKIT_URL ? "env" : mode;
                handleConnect(c, m);
              }}
              userSession={session}
            />
            <RoomAudioRenderer />
            <StartAudio label="Click to enable audio playback" />
          </LiveKitRoom>
        ) : (
          <PlaygroundConnect
            accentColor={themeColors[0]}
            onConnectClicked={(mode) => {
              handleConnect(true, mode);
            }}
          />
        )}
      </main>
    </>
  );
}