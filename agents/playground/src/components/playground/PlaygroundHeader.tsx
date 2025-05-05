import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { SettingsDropdown } from "@/components/playground/SettingsDropdown";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionState } from "livekit-client";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { ReactNode, useState } from "react";

type PlaygroundHeader = {
  logo?: ReactNode;
  title?: ReactNode;
  githubLink?: string;
  height: number;
  accentColor: string;
  connectionState: ConnectionState;
  onConnectClicked: () => void;
  userSession?: Session | null;
};

export const PlaygroundHeader = ({
  logo,
  title,
  githubLink,
  accentColor,
  height,
  onConnectClicked,
  connectionState,
  userSession,
}: PlaygroundHeader) => {
  const { config } = useConfig();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Get initials for user avatar
  const getUserInitials = () => {
    if (!userSession?.user?.name) return "U";
    return userSession.user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`flex gap-4 pt-4 text-${accentColor}-500 justify-between items-center shrink-0`}
      style={{
        height: height + "px",
      }}
    >
      <div className="flex items-center gap-3 basis-2/3">
        <div className="flex lg:basis-1/2">
          <a href="https://livekit.io">{logo ?? <LKLogo />}</a>
        </div>
        <div className="lg:basis-1/2 lg:text-center text-xs lg:text-base lg:font-semibold text-white">
          {title}
        </div>
      </div>
      <div className="flex basis-1/3 justify-end items-center gap-2">
        {/* User info and sign-out button */}
        {userSession && (
          <div className="flex items-center mr-2 relative">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-${accentColor}-600 text-white text-xs font-medium`}>
                {getUserInitials()}
              </div>
              <div className="hidden sm:flex text-white text-xs">
                {userSession.user?.name || userSession.user?.email || "User"}
              </div>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none" 
                className={`transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M2 4L6 8L10 4" 
                  stroke="white" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            {showUserMenu && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-gray-900 border border-gray-800 z-50"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="rounded-md">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-sm text-white">Signed in as</p>
                    <p className="text-xs font-medium text-gray-300 truncate">{userSession.user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {githubLink && (
          <a
            href={githubLink}
            target="_blank"
            className={`text-white hover:text-white/80`}
          >
            <GithubSVG />
          </a>
        )}
        {config.settings.editable && <SettingsDropdown />}
        <Button
          accentColor={
            connectionState === ConnectionState.Connected ? "red" : accentColor
          }
          disabled={connectionState === ConnectionState.Connecting}
          onClick={() => {
            onConnectClicked();
          }}
        >
          {connectionState === ConnectionState.Connecting ? (
            <LoadingSVG />
          ) : connectionState === ConnectionState.Connected ? (
            "Disconnect"
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </div>
  );
};

const LKLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_101_119699)">
      <path
        d="M19.2006 12.7998H12.7996V19.2008H19.2006V12.7998Z"
        fill="currentColor"
      />
      <path
        d="M25.6014 6.40137H19.2004V12.8024H25.6014V6.40137Z"
        fill="currentColor"
      />
      <path
        d="M25.6014 19.2002H19.2004V25.6012H25.6014V19.2002Z"
        fill="currentColor"
      />
      <path d="M32 0H25.599V6.401H32V0Z" fill="currentColor" />
      <path d="M32 25.5986H25.599V31.9996H32V25.5986Z" fill="currentColor" />
      <path
        d="M6.401 25.599V19.2005V12.7995V6.401V0H0V6.401V12.7995V19.2005V25.599V32H6.401H12.7995H19.2005V25.599H12.7995H6.401Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_101_119699">
        <rect width="32" height="32" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const GithubSVG = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 98 96"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      fill="currentColor"
    />
  </svg>
);
