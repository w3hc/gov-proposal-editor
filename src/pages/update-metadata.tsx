import { FC } from 'react'
import { APP_NAME } from '@/lib/consts'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { prepareWriteContract, writeContract } from '@wagmi/core'
import { useSigner } from 'wagmi'
import { govAbi, nftAbi } from '../lib/consts'
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link'
import Head from 'next/head'

const Home: FC = () => {

	const [err, setErr] = useState(false)

	const endpoint = 'https://goerli.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID
	const provider = new ethers.providers.JsonRpcProvider(endpoint)
	const nft = new ethers.Contract('0x70456d078950db075283931D9bE2E01B49f3e71e', nftAbi, provider)
	const addMemberCall = nft.interface.encodeFunctionData('setMetadata', ['3', "https://gateway.ipfs.io/ipfs/bafkreig4sehrl3fdyu3dek47j3dzsmeq6aq6v5t6wvjrzsbleyyw47p4oe"])
	const calldatas = [addMemberCall.toString()]

	const PROPOSAL_DESCRIPTION = "Update B's NFT metadata\nID #3\n\nNew CID: **https://gateway.ipfs.io/ipfs/bafkreig4sehrl3fdyu3dek47j3dzsmeq6aq6v5t6wvjrzsbleyyw47p4oe**" // Tally takes the first line as proposal title
	const targets = ['0x1B2EbCC8F787eA02f8C9184012Ebc96cd9C98DB4']
	const values = ["0"]

	const { data, error, isLoading, refetch } = useSigner()

	const gov = new ethers.Contract('0x690C775dD85365a0b288B30c338ca1E725abD50E', govAbi, data);

	const submitProposal = async () => {
		try {
			
			
			
			// const propose = await gov.propose(
			// 	targets, 
			// 	values, 
			// 	calldatas, 
			// 	PROPOSAL_DESCRIPTION
			// )
			// console.log("Propose triggered")
			// const proposeReceipt = await propose.wait(1)
			// const proposalId = proposeReceipt.events![0].args!.proposalId.toString()
			// console.log("proposalId:", proposalId)
			// console.log("proposalId:", proposalId)

		} catch(e) {
			console.log("error:", e)
			setErr(true)
		}
	}

	return (
		<>
			<Head>
				<title>Gov Proposal Editor</title>
				<meta name="description" content="Gov Proposal Editor simplifies the proposal submission process leveraging Web3.Storage (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to Medusa Network." />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
	
			<div className="relative flex items-top justify-center min-h-screen bg-gray-100 dark:bg-gray-900 sm:items-center py-4 sm:pt-0">

			<div>
				<div className="absolute top-6 left-6">
					<Link href="/">
					Home
					</Link>
				</div>

				<div className="absolute top-6 right-6">
					<ConnectWallet />
				</div>
				</div>

				<ThemeSwitcher className="absolute bottom-6 right-6" />

				{/* <div className="max-w-6xl mx-auto sm:px-6 lg:px-30"> */}
					
				<br /><br /><br /><br />
				
				<form>
					<div className="grid gap-6 mb-6 md:grid-cols-1">
						<div>
							<label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Amount (in ETH)</label>
							<input type="number" id="amount" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="0.001" required />
						</div>
						<div>
							
							<label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
							<textarea id="message"  className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="I made a cool contrib! "></textarea>
							</div>

						
						</div>
						{err == false ? 

						<div className="flex justify-center">

							<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 border border-pink-500 hover:border-transparent rounded" onClick={submitProposal}>
							Submit
							</button> 

						</div> : 

						<div className="flex justify-center">
							<p className="text-red-500">Proposal already submitted.</p>
						</div>

						}
				</form>
							
			</div>
		</>
	)
}

export default Home
