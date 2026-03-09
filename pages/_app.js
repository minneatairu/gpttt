import '../styles/globals.css'
import '../styles/home.css'
import Head from "next/head"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
