import { useTheme } from 'next-themes'
import { APP_NAME } from '@/lib/consts'
import { createClient, WagmiConfig, chain } from 'wagmi'
import { arbitrumGoerli } from 'wagmi/chains'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'

const chains = [ arbitrumGoerli ];

const alchemyId = process.env.NEXT_PUBLIC_ARBITRUM_ALCHEMY_ID;

const client = createClient(
	getDefaultClient({
		appName: APP_NAME,
		alchemyId,
		chains,
	  }),
)

const Web3Provider = ({ children }) => {
	const { resolvedTheme } = useTheme()

	return (
		<WagmiConfig client={client}>
			<ConnectKitProvider mode={resolvedTheme as 'light' | 'dark'}>{children}</ConnectKitProvider>
		</WagmiConfig>
	)
}

export default Web3Provider
