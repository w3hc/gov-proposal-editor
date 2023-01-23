import { FC } from 'react'
import { APP_NAME } from '@/lib/consts'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { prepareWriteContract, writeContract } from '@wagmi/core'
import { useSigner } from 'wagmi'
import { govAbi, nftAbi } from '../lib/consts'
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from "react";

const Home: FC = () => {

	const [gif, setGif] = useState(false)

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
			const propose = await gov.propose(
				targets, 
				values, 
				calldatas, 
				PROPOSAL_DESCRIPTION
			  )
			  console.log("Propose triggered")
			  const proposeReceipt = await propose.wait(1)
			  const proposalId = proposeReceipt.events![0].args!.proposalId.toString()
			  console.log("proposalId:", proposalId)
			  console.log("proposalId:", proposalId)
		} catch(e) {
			console.log("error:", e)
			setGif(true)
		}
	}

	return (
		<div className="relative flex items-top justify-center min-h-screen bg-gray-100 dark:bg-gray-900 sm:items-center py-4 sm:pt-0">
			<div className="absolute top-6 right-6">
				<ConnectWallet />
			</div>
			<ThemeSwitcher className="absolute bottom-6 right-6" />
			<div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
				<div className="flex justify-center pt-8 sm:justify-start sm:pt-0">
					<h1 className="text-6xl font-bold dark:text-white">{APP_NAME}</h1>
				</div>
				
				<br /><br /><br /><br />

				{gif == false ? 
				<div className="flex justify-center">
				
					<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 border border-pink-500 hover:border-transparent rounded" onClick={submitProposal}>
					Submit
					</button> 
				</div> : 

				<div className="flex justify-center">
					<p className="text-red-500">Proposal already submitted.</p>
				</div>
	
				}

			</div>
		</div>
	)
}

export default Home
