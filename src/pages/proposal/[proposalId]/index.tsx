import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { govAbi, TALLY_DAO_NAME } from '../../../lib/consts'
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import {useRouter} from 'next/router'
import { Inter } from '@next/font/google'

const inter = Inter({ subsets: ['latin'] })
const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
const provider = new ethers.providers.JsonRpcProvider(endpoint)

const ProposalPage: FC = () => {

	const encrypted:boolean = true

	const router = useRouter()
    const proposalId = router.query.proposalId as string
	const tallyLink = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"+proposalId
	const [selectedFile, setSelectedFile] = useState(null);
	const [decryptedFile, setDecryptedFile] = useState("")

	const { data, error, isLoading, refetch } = useSigner()
	const gov = new ethers.Contract('0x17BccCC8E7c0DC62453a508988b61850744612F3', govAbi, provider)

	const [block, setBlock] = useState(0);
	const [proposal, setProposal] = useState<{id:string; link:string, title: string, state: number, description: string, selectedFile: string}[]>([{
		id: "12345678",
		link: "http://link.com",
		title: "",
		state: 0, 
		description: "",
		selectedFile: ""
	},]);
	const [initialized, setInitialized] = useState(false);

	const proposalState = [
		"Pending",
		"Active",
		"Canceled",
		"Defeated",
		"Succeeded",
		"Queued",
		"Expired",
		"Executed"
	]
	const baseUrl = "/proposal/"
 
	useEffect(() => {
		getBlock();
	},[]);

	const decrypt = async (fileToDecrypt:any) => {
	// const decrypt = async () => {
		if (encrypted != true) {


			// Medusa


			setDecryptedFile("https://ipfs.io/ipfs/Qmc8xVdanhodtSEwCXbYYU3uC6hPGwmdDBbTucLHtLEm3j/nft.jpg") // placeholder
			return "https://ipfs.io/ipfs/Qmc8xVdanhodtSEwCXbYYU3uC6hPGwmdDBbTucLHtLEm3j/nft.jpg" // placeholder
		} else {
			setDecryptedFile("https://ipfs.io/ipfs/Qmc8xVdanhodtSEwCXbYYU3uC6hPGwmdDBbTucLHtLEm3j/nft.jpg") // placeholder
			return "https://ipfs.io/ipfs/Qmc8xVdanhodtSEwCXbYYU3uC6hPGwmdDBbTucLHtLEm3j/nft.jpg" // placeholder
		}
	}
	
	const getBlock = async () => {
		const blockNumber = await provider.getBlockNumber();
		setBlock(blockNumber);
	}

	const getState = async (proposalId) => {
		return await gov.state(proposalId);
	}

	const getProposals = useCallback( async () => {
		if (block > 1) {
		const proposals = await gov.queryFilter("ProposalCreated", 5702215, block);
		try {

			let i:number = 0;
			let proposalsRaw = proposal;

			if (proposals[0].args != undefined) {
				for( i; i < Number(proposals.length) ; i++) {

					console.log(String(proposals[i].args[8]))
					const id = String(proposals[i].args?.proposalId)

					if (id == proposalId) {
						proposalsRaw.push(...[{
							id: String(proposals[i].args?.proposalId), 
							link: baseUrl + String(proposals[i].args?.proposalId),
							title: proposals[i].args[8].substring(proposals[i].args[8][0]=="#" ? 2 : 0, proposals[i].args[8].indexOf("\n")),
							state: await getState(proposals[i].args?.proposalId), 
							description: proposals[i].args[8].substring(proposals[i].args[8].indexOf("\n"),proposals[i].args[8].indexOf("[")),
							selectedFile: proposals[i].args[8].substring(proposals[i].args[8].indexOf("(") +1 ,proposals[i].args[8].indexOf(")") )
						}])
						setSelectedFile(proposals[i].args[8].substring(proposals[i].args[8].indexOf("(") +1 ,proposals[i].args[8].indexOf(")") ))
					}	
				}
				delete proposal[0];
				setProposal(proposalsRaw);
				setInitialized(true);
				}
			} catch(error) {
				console.log("error:", error)
			}
		}
	// },[block, proposal, getState, proposalId, gov])
	},[block, proposal])

	useEffect(() => {
		getProposals()
		if (selectedFile) {
			decrypt(selectedFile)
		}
	// },[getProposals, proposal, decrypt, selectedFile])
	},[getProposals, proposal])

	function Item(props:any) {

		return (
			
			<>
				<h1 style={{color:"#45a2f8"}}><strong>{props.title}</strong></h1><br />
				<p><small>Status: { proposalState[props.state]}</small></p>
				<br />

				<p>{props.description}</p>

				<br />

				{selectedFile ? 
					
					(encrypted == false ?
						<p style={{color:"red"}}>
						This file is only accessible to the DAO members.
					</p> : 
					<p>
						<Image 
							width="300" 
							height="300" 
							alt={"selectedFile"} 
							src={ decryptedFile } 
						/>
					</p> 
					)
					 
						
				: <p>No document attached.</p> }

			</> 
		)
	} 
	
	function List() {
		return (
			<>
				<div>
					{proposal.map((p) => <Item key={p.id} title={p.title} state={p.state} id={p.id} link={p.link} description={p.description} selectedFile={p.selectedFile}/>)}
				</div>
			</>
		);
	}

	return (
		<>
			<Head>
				<title>Gov Proposal Editor</title>
				<meta name="description" content="Gov Proposal Editor simplifies the proposal submission process leveraging Web3.Storage (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to Medusa Network." />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* <link rel="icon" href="./favicon.ico" /> */}
			</Head>
	
			<div className="items-top justify-center min-h-screen bg-gray-100 dark:bg-gray-900 sm:items-center py-4 sm:pt-0">

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

				<div className="max-w-6xl mx-auto sm:px-6 lg:px-200">
						
					<div className="grid max-w-lg gap-6 mb-6 md:grid-cols-1">
						<br /> <br /> <br /> <br /> 
					</div>
				
					<div className="grid gap-6 mb-6 md:grid-cols-1" >
						<div>
							<div className="justify-center flex ">
								<div>
									{initialized === true ? 

									<>

										<div className={inter.className}>									
											<List />
										</div>

										<br />

										<div className="flex justify-center">
											
										<a
											href={tallyLink}
											target="_blank" 
											rel="noopener noreferrer"
											style={{color:"#45a2f8"}}
										>
											<strong>View on Tally</strong>
										</a>

										</div> 
									
									</>
									: <p className={inter.className}>Loading...</p> }
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default ProposalPage
