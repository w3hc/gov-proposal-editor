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
import { Medusa, EVMG1Point, HGamalEVMCipher } from "@medusa-network/medusa-sdk"

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
	const [provider, setProvider] = useState(new ethers.providers.JsonRpcProvider(endpoint))
	const [isEncrypted, setIsEncrypted] = useState(false)
	const [decryptedFile, setDecryptedFile] = useState("")
	const [initialized, setInitialized] = useState(false);

	const medusaClient = new ethers.Contract(
		MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
		meduasaClientAbi, 
		signer
	)

	const getBlock = async () => {
		const blockNumber = await provider.getBlockNumber()
		setBlock(blockNumber)
		return blockNumber
	}

	const decrypt = async () => {

		console.log("decrypt triggered...")

		console.log("uri:", uri)
		console.log("isEncrypted:", isEncrypted)
		console.log("initialized:", initialized)
		
		if (isEncrypted === true) {

			// Medusa init
			const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer)
			console.log("medusa init:", medusa)

			const pubkeyFromContract = await medusaClient.publicKey()
			console.log("pubkeyFromContract:", pubkeyFromContract)
			// const { x, y } = pubkeyFromContract

			// handle buyerPublicKey
			const keypair = await medusa.signForKeypair()
			const { x, y } = keypair.pubkey.toEvm()
    		const evmPoint = { x, y }
			const buyerPublicKey:EVMG1Point = evmPoint
			console.log("buyerPublicKey:", buyerPublicKey)
			
			console.log("call blockNumber:", await getBlock())
			// calling buyListing (client app contract)
			const buyListing = await medusaClient.buyListing(

				uri,
				buyerPublicKey
				,{gasLimit: 500000}

			)
			console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + buyListing.hash )
			buyListing.wait(3)
			console.log("buyListing.blockNumber:", buyListing.block )

			// get the request ID
			let requestId = null
			try {
				requestId = await medusaClient.requests(uri)
			} catch (error) {
				console.error('Error decrypt: ', error)
			}
			console.log("requestId:", requestId)
			
			const requestIdFormatted = parseInt(requestId)
			console.log("requestIdFormatted:", requestIdFormatted)

			// get cipher
			const ciphertext = await medusaClient.queryFilter( "ListingDecryption", 6895301, 6895311 )
			console.log("ciphertext:", ciphertext[0].args.ciphertext)

			const ciphertext2 = await medusaClient.ciphers(requestIdFormatted)
			console.log("ciphertext2:", ciphertext2 )

			const response = await fetch(uri)
			console.log("response:", response)
			const encryptedContents = Base64.toUint8Array(await response.text())
			console.log("encryptedContents:", encryptedContents)

			// decrypt
			let decryptedBytes = null
			try {

				const blob = encryptedContents

				decryptedBytes = await medusa.decrypt(			 		// "Called `_unsafeUnwrap` on an Err"

					ciphertext[0].args.ciphertext, // encryptedKey
					blob, // encrypted data/file						// Error: Authenticated decryption failed at HGamalSuite.decryptFromMedusa (webpack-internal:///./node_modules/@medusa-network/medusa-sdk/lib/src/encrypt.js:124:42) at async Medusa.decrypt (webpack-internal:///./node_modules/@medusa-network/medusa-sdk/lib/src/index.js:165:31) at async decrypt (webpack-internal:///./src/pages/proposal/[proposalId]/index.tsx:118:34)

				)

			} catch (error) {
				console.error('Error decrypt: ', error);
			}

			console.log("decryptedBytes:", decryptedBytes)
			if (decryptedBytes) {
				const plaintext = new TextDecoder().decode(decryptedBytes)
				setDecryptedFile(plaintext)
			} else {
				setDecryptedFile("https://bafybeigetzcsf4vww5pcqonij6o7pctktuxlandszjylw5p3zot5hgyeea.ipfs.w3s.link/lode-runner.png")
			}
			
		} else {
			setDecryptedFile(uri)
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
							setDescription(proposals[i].args[8].substring(proposals[i].args[8].indexOf("desc"),proposals[i].args[8].indexOf("[")))
							setUri(proposals[i].args[8].substring(proposals[i].args[8].indexOf("(") +1 ,proposals[i].args[8].indexOf(")") ))
							if (proposals[i].args[8].substring(proposals[i].args[8].indexOf(")")+2) === "encrypted") {
								setIsEncrypted(true)
							} else {
								setIsEncrypted(false)
							}
							setInitialized(true)
							console.log("proposals[i].args[8]:", proposals[i].args[8])
							console.log("uri:", uri)

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
														<><div className="flex justify-center">

														<Image 
															width="350" 
															height="350" 
															alt={"uri"} 
															src={ decryptedFile === "" ? "https://bafybeifk3jjwguug5avwjfi2qxnh5lcq6dhpwf4h333gac6edd3irbylve.ipfs.w3s.link/carre-blanc.png" : decryptedFile } 
														/></div>
														<br /><p style={{color:"red"}}>
														{ "This file is only accessible to the DAO members." }
														</p><br /></> : 
														<div className="flex justify-center">

														<Image 
															width="350" 
															height="350" 
															alt={"uri"} 
															src={ decryptedFile === "" ? "https://bafybeifk3jjwguug5avwjfi2qxnh5lcq6dhpwf4h333gac6edd3irbylve.ipfs.w3s.link/carre-blanc.png" : decryptedFile } 
														/></div> }
													
														<br /><p style={{color:"red"}}><strong>
														{ decryptedFile === "" ? "" : "This file is only accessible to the DAO members." }
														</strong></p><br />

														<div className="flex justify-center">
															<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
															onClick={decrypt}>
															Decrypt
															</button>  
														</div>
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
