import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import type { ThemeConfig } from "antd";
import { ConfigProvider } from "antd";

const theme: ThemeConfig = {
  token: {
    fontSize: 16,
    colorPrimary: '#991b1b',
  },
};

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
     <SessionProvider session={session}>
       <ConfigProvider theme={theme}>
         <Component {...pageProps} />
       </ConfigProvider>
     </SessionProvider>
  );
}
