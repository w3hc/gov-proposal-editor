import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { govAbi, TALLY_DAO_NAME } from '../lib/consts'
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link'
import Head from 'next/head'
import { UploadFile } from '../components/UploadFile'
import { Inter } from '@next/font/google'
import styles from '../../styles/Home.module.css'

const inter = Inter({ subsets: ['latin'] })

const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
// const endpoint = "https://endpoints.omniatech.io/v1/arbitrum/goerli/public"
console.log(endpoint)
const provider = new ethers.providers.JsonRpcProvider(endpoint)
// const baseUrl = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"

const Home: FC = () => {

	const { data, error, isLoading, refetch } = useSigner()
	const gov = new ethers.Contract('0x17BccCC8E7c0DC62453a508988b61850744612F3', govAbi, provider)

	const [block, setBlock] = useState(0);
	const [manifesto, setManifesto] = useState("")
	const [name, setName] = useState("")
	const [manifestoLink, setManifestoLink] = useState("")
	const [proposal, setProposal] = useState<{id:string; link:string, title: string, state: number}[]>([{
		id: "12345678",
		link: "http://link.com",
		title: "",
		state: 0
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
		getBlock()
		getName()
		getManifesto()
	},[])
	
	const getBlock = async () => {
		const blockNumber = await provider.getBlockNumber();
		setBlock(blockNumber);
	}

	const getManifesto = async () => {
		const manifesto = await gov.manifesto();
		console.log("manifesto:", manifesto)
		if (manifesto === "") {
			setManifesto("unset")
			setManifestoLink("https://bafybeihmgfg2gmm23ozur3ylmkxgwkyr5dlpruivv3wjeujrdktxihqe3a.ipfs.w3s.link/manifesto.md")
		} else {
			setManifesto(manifesto)
			setManifestoLink("https://" + manifesto + ".ipfs.w3s.link")
		}
	}

	const getName = async () => {
		const name = await gov.name();
		console.log("name:", name)
		if (name === "") {
			setName("unset")
		} else {
			setName(name)
		}
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
				// for( i ; i < Number(proposals.length) ; i++) {
				for( i = 83; i < Number(proposals.length) ; i++) {
						// console.log("executed:", String(proposals[i].args?.proposalId))
				console.log("proposals[i]:", proposals[i].args[8][0])

				proposalsRaw.push(...[{
				id: String(proposals[i].args?.proposalId), 
				link: baseUrl + String(proposals[i].args?.proposalId),
				title: proposals[i].args[8].substring(proposals[i].args[8][0]=="#" ? 2 : 0, proposals[i].args[8].indexOf("\n")),
				state: await getState(proposals[i].args?.proposalId)
				}])
			}
			delete proposal[0];
			setProposal(proposalsRaw);
			// console.log("proposal post loop:", proposal);
			setInitialized(true);
			}
		} catch(error) {
			console.log("error:", error)
		}
		}
	},[block, proposal])

	useEffect(() => {
		getProposals();
		// console.log("proposal in useEffect:", proposal);

	},[getProposals, proposal]);

	function Item(props) {
		return <>
			<div className="md:container md:mx-auto border m-3 p-2 dark:border-pink-600 rounded-lg">
				<div>
					<strong><a 
					style={{color:"#45a2f8"}} 
					href = {props.link}>{props.title} 
					</a></strong>
				</div>
				<div>
					<small>{proposalState[props.state]}</small>
				</div>
			</div>
		</>
	} 
	
	function List() {
		return (
		<div >
			{proposal.map((p) => <Item key={p.id} title={p.title} state={p.state} id={p.id} link={p.link} />)}
		</div>
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
								{initialized === true ? <>
        
									<div className={inter.className}>
							
									<h1><strong>{name}</strong></h1><br />
									<p>Gov contract address: <strong><a style={{color:"#45a2f8"}} target="_blank" rel="noopener noreferrer" href="https://goerli.arbiscan.io/address/0x17BccCC8E7c0DC62453a508988b61850744612F3#code">{gov.address}</a></strong></p><br />
									<p>Manifesto: <a style={{color:"#45a2f8"}} target="_blank" rel="noopener noreferrer" href={manifestoLink}><strong>{manifesto}</strong></a></p><br />
									
									<h3>All proposals: </h3><br />

									<List />

									
									</div>

									<div className="flex justify-center">
									<Link
											href="/editor"
										>
											<br /><br /><button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-3 px-6 border border-pink-500 hover:border-transparent rounded" >
												New proposal
											</button>
										</Link>
									</div>
									
									</>

									: <p className={inter.className}>Loading...</p>}
								</div>
							</div>
						</div>

        
		

					{/* {err != true ? 

					<div className="flex justify-center">

						<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-10 border border-pink-500 hover:border-transparent rounded" 
						>
						Submit
						</button> 

					</div> : 

					<div className="flex justify-center">
						<p className="text-red-500"><strong>You can&apos;t do that, my friend!</strong> 😿</p>
					</div>

					} */}
				</div>
			</div>
			</div>
		</>
	)
}

export default Home
