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
import { Base64 } from "js-base64";
import { Medusa, EVMG1Point, SuiteType } from "@medusa-network/medusa-sdk"

const inter = Inter({ subsets: ['latin'] })

const ProposalPage: FC = () => {

	const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL

	const router = useRouter()
    const proposalId = router.query.proposalId as string
	const [block, setBlock] = useState(0)
	const tallyLink = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"+proposalId
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	// const [state, setState] = useState("")
	const [selectedFile, setSelectedFile] = useState(null)
	const [provider, setProvider] = useState(new ethers.providers.JsonRpcProvider(endpoint))
	const [isEncrypted, setIsEncrypted] = useState(false)
	const [decryptedFile, setDecryptedFile] = useState("")
	const [initialized, setInitialized] = useState(false);

	const { data, error, isLoading, refetch } = useSigner()
	const signer = data
	const gov = new ethers.Contract('0x17BccCC8E7c0DC62453a508988b61850744612F3', govAbi, provider)

	// const proposalState = [
	// 	"Pending",
	// 	"Active",
	// 	"Canceled",
	// 	"Defeated",
	// 	"Succeeded",
	// 	"Queued",
	// 	"Expired",
	// 	"Executed"
	// ]

	const getBlock = async () => {
		const blockNumber = await provider.getBlockNumber();
		setBlock(blockNumber);
	}

	// const getState = async (proposalId:string) => {
	// 	return await gov.state(proposalId)
	// }

	const decrypt = async () => {

		console.log("decrypt triggered...")
		
		if (isEncrypted != true) {

			const b64EncryptedData = Base64.fromUint8Array(selectedFile)

			const encryptedData = Base64.toUint8Array(b64EncryptedData); // Only if encryptedData was base64 encoded, then base64 decode
			
			// call to buyListing

			/* 

			uint256 cipherId,
        	G1Point calldata buyerPublicKey

			//////
			
			uint256 requestId = oracle.requestReencryption(
            cipherId,
            buyerPublicKey
			);
			emit NewSale(msg.sender, listing.seller, requestId, cipherId);
			return requestId;

			*/

			const medusaOracleAddress = "0xf1d5A4481F44fe0818b6E7Ef4A60c0c9b29E3118"
			const medusa = await Medusa.init(medusaOracleAddress, signer);
			console.log("medusa:", medusa)


			const decryptedBytes = await medusa.decrypt(
			  null,
			  encryptedData,
			);
			const plaintext = new TextDecoder().decode(decryptedBytes) // To decode bytes to UTF-8


			// return base64
		
		} else {
			// setDecryptedFile("https://ipfs.io/ipfs/Qmc8xVdanhodtSEwCXbYYU3uC6hPGwmdDBbTucLHtLEm3j/nft.jpg") // placeholder
			// return "https://ipfs.io/ipfs/Qmc8xVdanhodtSEwCXbYYU3uC6hPGwmdDBbTucLHtLEm3j/nft.jpg" // placeholder
		}
	}
	
	const getProposalData = useCallback( async () => {

		if (block > 1) {

			const proposals = await gov.queryFilter("ProposalCreated", 5702215, block)

			try {

				let i:number = 0;

				if (proposals[0].args != undefined) {

					for( i; i < Number(proposals.length) ; i++) {

						const id = String(proposals[i].args?.proposalId)

						if (id == proposalId) {

							setTitle(proposals[i].args[8].substring(proposals[i].args[8][0]=="#" ? 2 : 0, proposals[i].args[8].indexOf("\n")))
							setDescription(proposals[i].args[8].substring(proposals[i].args[8].indexOf("\n"),proposals[i].args[8].indexOf("[")))
							setSelectedFile(proposals[i].args[8].substring(proposals[i].args[8].indexOf("(") +1 ,proposals[i].args[8].indexOf(")") ))
							if (proposals[i].args[8].substring(proposals[i].args[8].indexOf(")")+2) === "encrypted") {
								setIsEncrypted(true)
							} else {
								setIsEncrypted(false)
							}
							setInitialized(true)
							console.log("proposals[i].args[8]:", proposals[i].args[8])
						}	
					}
				}
			} catch(error) {
				console.error("error:", error)
			}
		}
	},[block])

	useEffect(() => {
		getBlock()
		// getState(proposalId)
		getProposalData()
		console.log("selectedFile:", selectedFile)
		console.log("isEncrypted:", isEncrypted)
		console.log("initialized:", initialized)
	},[getProposalData]);

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

											<h1 style={{color:"#45a2f8"}}><strong>{title}</strong></h1><br />

											{/* <p><small>Status: {state} </small></p> */}
											
											<br />

											<p>{description}</p>

											<br />

											{selectedFile ? 
												
												(isEncrypted == true ?

													<>

														<p style={{color:"red"}}>
														This file is only accessible to the DAO members.
														</p>

														<div className="flex justify-center">
															<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
															onClick={decrypt}>
															Decrypt
															</button>  
														</div>
													</> : 
													<> 
														<Image 
															width="300" 
															height="300" 
															alt={"selectedFile"} 
															src={ decryptedFile === "" ? selectedFile : decryptedFile } 
														/>
													<div className="flex justify-center">

														<button 
															className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
															onClick={decrypt}
														>
														Decrypt
														</button>  
													</div>
												</> ) : <p>No document attached.</p> }
			
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
