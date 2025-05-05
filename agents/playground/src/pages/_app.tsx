import { CloudProvider } from "@/cloud/useCloud";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { ConfigProvider } from "@/hooks/useConfig";
import { ToastProvider } from "@/components/toast/ToasterProvider";
import { ConnectionProvider } from "@/hooks/useConnection";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <CloudProvider>
        <ToastProvider>
          <ConfigProvider>
            <ConnectionProvider>
              <Component {...pageProps} />
            </ConnectionProvider>
          </ConfigProvider>
        </ToastProvider>
      </CloudProvider>
    </SessionProvider>
  );
}
