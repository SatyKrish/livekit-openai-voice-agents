import { Button } from "@/components/button/Button";
import { signIn, getProviders } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";

interface SignInProps {
  providers: Record<string, any> | null;
}

export default function SignIn({ providers }: SignInProps) {
  const router = useRouter();
  const { callbackUrl } = router.query;

  return (
    <>
      <Head>
        <title>Sign in - LiveKit Agents Playground</title>
        <meta name="description" content="Sign in to LiveKit Agents Playground" />
      </Head>
      <div className="flex left-0 top-0 w-full h-full bg-black repeating-square-background items-center justify-center text-center">
        <div className="min-h-[540px]">
          <div className="flex flex-col bg-gray-950 w-full max-w-[480px] rounded-lg text-white border border-gray-900">
            <div className="flex flex-col gap-2">
              <div className="px-10 space-y-2 py-6">
                <h1 className="text-2xl">Sign In</h1>
                <p className="text-sm text-gray-500">
                  Sign in to access LiveKit Agents Playground
                </p>
              </div>
            </div>
            <div className="flex flex-col bg-gray-900/30 flex-grow p-8 gap-4">
              {providers && Object.keys(providers).length > 0 ? (
                Object.values(providers).map((provider) => (
                  <div key={provider.name} className="flex justify-center">
                    <Button
                      accentColor="cyan"
                      className="w-full"
                      onClick={() => signIn(provider.id, { callbackUrl: callbackUrl as string || "/" })}
                    >
                      Sign in with {provider.name}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-4">No authentication providers configured.</p>
                  <p className="text-sm text-gray-500">
                    Please configure authentication providers in your .env.local file.
                  </p>
                  <Button
                    accentColor="cyan"
                    className="w-full mt-4"
                    onClick={() => router.push('/')}
                  >
                    Continue without signing in
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders();
  return {
    props: { providers },
  };
};