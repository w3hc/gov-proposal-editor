import { FC } from 'react'
import { APP_NAME } from '@/lib/consts'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useRouter } from "next/router";
import Link from 'next/link'
import Head from 'next/head'


const Home: FC = () => {

	const router = useRouter();

	return (
		<>
			<Head>
				<title>Gov Proposal Editor</title>
				<meta name="description" content="Gov Proposal Editor simplifies the proposal submission process leveraging Web3.Storage (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to Medusa Network." />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<div className="relative flex items-top justify-center min-h-screen bg-gray-100 dark:bg-gray-900 sm:items-center py-4 sm:pt-0">

				<div className="absolute top-6 right-6">
					<ConnectWallet />
				</div>

				<ThemeSwitcher className="absolute bottom-6 right-6" />

				<div className="max-w-6xl sm:px-6 lg:px-8">

					<div className="flex justify-center pt-8 sm:justify-start sm:pt-0">
						<h1 className="text-6xl font-bold dark:text-white">{APP_NAME}</h1>
					</div>
					
					<br /><br />

					<p>We now have great tools to build DAOs, including Open Zeppelin&apos;s Governor and Tally. Gov is a DAO template that combines Governor and ERC-721. Tally&apos;s UX is pretty remarkable, Gov Proposal Editor simplifies the proposal submission process leveraging Web3.Storage (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to Medusa Network.</p>

					<br /><br /><br /><br />

					<div className="flex justify-center">
						<Link
							href="/editor"
						>
							<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-3 px-6 border border-pink-500 hover:border-transparent rounded" >
								Let&apos;s go!
							</button>
						</Link>
					</div>
				</div>
			</div>
		</>
	)
}

export default Home
