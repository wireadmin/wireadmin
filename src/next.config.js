function publicENV(ex = {}) {
  Object.entries(process.env)
     .filter(([ key ]) => key.startsWith('NEXT_PUBLIC_'))
     .forEach(([ key, value ]) => ex[key] = value)
  return ex
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  env: publicENV({}),
  images: {
    domains: [ 'img.shields.io' ]
  }
}

module.exports = nextConfig;
