/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
		  {
			protocol: 'https',
			hostname: "*",
			// port: '*',
			// pathname: '*',
			
			// domains: ['bafkreicuv6k5zkils3fclg7m2ldfyhtnkphnl46eztmh3sdb76y6gipkxm.ipfs.w3s.link"'],
			
		  },
		],
	  },
}

module.exports = nextConfig
