import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { govAbi, meduasaClientAbi, TALLY_DAO_NAME, MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, MEDUSA_ORACLE_CONTRACT_ADDRESS } from '../../../lib/consts'
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import {useRouter} from 'next/router'
import { Inter } from '@next/font/google'
import { Base64 } from "js-base64";
import { Medusa } from "@medusa-network/medusa-sdk"

const inter = Inter({ subsets: ['latin'] })

const ProposalPage: FC = () => {

	const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
	const router = useRouter()
    const proposalId = router.query.proposalId as string
	const { data: signer, isError, isLoading } = useSigner()
	const gov = new ethers.Contract('0x17BccCC8E7c0DC62453a508988b61850744612F3', govAbi, signer)
	
	const [block, setBlock] = useState(0)
	const tallyLink = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"+proposalId
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [uri, setUri] = useState(null)
	const [isEncrypted, setIsEncrypted] = useState(false)
	const [decryptedFile, setDecryptedFile] = useState("")
	const [isDecrypted, setIsDecrypted] = useState(false)
	const [initialized, setInitialized] = useState(false);

	const medusaClient = new ethers.Contract(
		MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
		meduasaClientAbi, 
		signer
	)

	const getBlock = async () => {
		const provider = new ethers.providers.JsonRpcProvider(endpoint)
		const blockNumber = await provider.getBlockNumber()
		setBlock(blockNumber)
		return blockNumber
	}

	const decrypt = async () => {

		console.log("decrypt triggered...")
		
		if (isEncrypted === true) {

			// Medusa init
			const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer)
			console.log("medusa init:", medusa)

			// get buyer public key
			const keypair = await medusa.signForKeypair()
			const buyerPublicKey = keypair.pubkey.toEvm()
			console.log("buyer public key:", buyerPublicKey)
			
			// calling buyListing (client app contract)
			const buyListing = await medusaClient.buyListing(

				uri,
				buyerPublicKey

			)
			console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + buyListing.hash )
			console.log("Waiting for 5 confirmations...")
			buyListing.wait(5)
			console.log("buyListing.blockNumber:", buyListing.blockNumber )

			// get requestId from url
			const requestId = await medusaClient.requests(uri)
			const requestIdFormatted = parseInt(requestId)

			// get ciphertext from mapping (requestId)
			const ciphertext = await medusaClient.ciphers(requestIdFormatted)
			console.log("ciphertext:", ciphertext)

			// download and read encrypted data from url
			const myBlob = await fetch(uri)
			let result = null
			if (myBlob.ok) { result = await myBlob.text() }
			console.log("blob", myBlob)
			const blob = Base64.toUint8Array(result)

			// medusa.decrypt
			try {

				const plaintextBytes = await medusa.decrypt( 
					ciphertext,
					blob,
				)
				console.log("✅ decrypt done")

				if (plaintextBytes) {
					// from bytes to plaintext
					const plaintextString = new TextDecoder().decode(plaintextBytes)
					console.log("plaintextString:", plaintextString)
					setDecryptedFile(plaintextString)
				} else {
					setDecryptedFile("https://bafybeigetzcsf4vww5pcqonij6o7pctktuxlandszjylw5p3zot5hgyeea.ipfs.w3s.link/lode-runner.png")
				} 
				
				setIsDecrypted(true)
		
			} catch (error) {
				console.error('Error decrypt: ', error);
			}

		}
		
	}
	
	const getProposalData = useCallback( async () => {

		getBlock()

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
							// console.log("desc:", proposals[i].args[8].substring(proposals[i].args[8].indexOf("\n"),proposals[i].args[8].indexOf("[")))
							setUri(proposals[i].args[8].substring(proposals[i].args[8].indexOf("(") +1 ,proposals[i].args[8].indexOf(")") ))
							if (proposals[i].args[8].substring(proposals[i].args[8].indexOf(")")+2) === "encrypted") {
								setIsEncrypted(true)
							} else {
								setIsEncrypted(false)
							}
							setInitialized(true)
							console.log("original description:", proposals[i].args[8])
						}	
					}
				}
			} catch(error) {
				console.error("error:", error)
			}
		}
	},[block])

	useEffect(() => {
		getProposalData()
		console.log("[init] uri:", uri)
		console.log("[init] isEncrypted:", isEncrypted)
		console.log("[init] initialized:", initialized)
	},[getProposalData]);

	return (
		<>
			<Head>
				<title>Gov Proposal Editor</title>
				<meta name="description" content="Gov Proposal Editor simplifies the proposal submission process leveraging Web3.Storage (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to Medusa Network." />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
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
										<div className={inter.className }>

											<h1 style={{color:"#45a2f8"}}><strong>{title}</strong></h1><br />

											{/* <p><small>Status: {state} </small></p> */}
											
											<br />

											<p>{description}</p>

											<br />

											{uri ? 
												
												(isEncrypted == true ?

													<>
													{decryptedFile === "" ? 
														<>
														
														<div className="flex justify-center">

														<Image 
															width="350" 
															height="350" 
															alt={"uri"} 
															src={ decryptedFile === "" ? "https://bafybeifk3jjwguug5avwjfi2qxnh5lcq6dhpwf4h333gac6edd3irbylve.ipfs.w3s.link/carre-blanc.png" : decryptedFile } 
														/></div>
														{/* <br /><p style={{color:"red"}}>
														{"This file is only accessible to the DAO members." }
														</p><br /> */}
														
														</> : 
														<div className="flex justify-center">

														<Image 
															width="350" 
															height="350" 
															alt={"uri"} 
															src={ decryptedFile === "" ? "https://bafybeifk3jjwguug5avwjfi2qxnh5lcq6dhpwf4h333gac6edd3irbylve.ipfs.w3s.link/carre-blanc.png" : decryptedFile } 
														/></div> }
														
														{ isDecrypted ? "" : 
														<>
															<br /><p style={{color:"red"}}><strong>
																This file is only accessible to the DAO members.
															</strong></p><br />

															<div className="flex justify-center">
																<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
																onClick={decrypt}>
																Decrypt
																</button>  
															</div>
														</>}
													</> : 
													<> 
														<Image 
															width="400" 
															height="400" 
															alt={"uri"} 
															src={ uri } 
														/>
														
													{/* <div className="flex justify-center">

														
														<button 
															className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
															onClick={decrypt}
														>
														Decrypt
														</button>  
													</div> */}
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
