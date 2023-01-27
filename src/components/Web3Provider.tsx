import { useTheme } from 'next-themes'
import { APP_NAME } from '@/lib/consts'
import { createClient, WagmiConfig, chain } from 'wagmi'
import { arbitrumGoerli } from 'wagmi/chains'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'

const chains = [ arbitrumGoerli ];

// const alchemyId = process.env.ALCHEMY_ID;
const alchemyId = "ca2mVd6UfNr5N0YeaKRG4V6J4QgC_jD1";


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
