import { useTheme } from 'next-themes'
import { APP_NAME } from '@/lib/consts'
import { createClient, WagmiConfig, chain } from 'wagmi'
import { goerli } from 'wagmi/chains'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'

const chains = [goerli];

const client = createClient(
	getDefaultClient({
		appName: APP_NAME,
		autoConnect: true,
		infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
		chains,
	})
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
