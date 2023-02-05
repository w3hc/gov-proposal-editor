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
import { Medusa, EVMG1Point, SuiteType } from "@medusa-network/medusa-sdk"
import { HGamalEVMCipher } from '@medusa-network/medusa-sdk'
import axios from 'axios'
import { ipfsGatewayLink } from '@/lib2/utils'

const inter = Inter({ subsets: ['latin'] })

const ProposalPage: FC = () => {

	const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
	// const provider = new ethers.providers.JsonRpcProvider(endpoint)

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
	const [cipherId, setCipherId] = useState(0);

	const { data: signer, isError, isLoading } = useSigner()
	const gov = new ethers.Contract('0x17BccCC8E7c0DC62453a508988b61850744612F3', govAbi, signer)

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

	const medusaClient = new ethers.Contract(
		MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
		meduasaClientAbi, 
		signer
	)

	const getBlock = async () => {
		const blockNumber = await provider.getBlockNumber();
		setBlock(blockNumber);
	}

	// const getState = async (proposalId:string) => {
	// 	return await gov.state(proposalId)
	// }

	const getCipherId = async (selectedFile:any) => {
		console.log("selectedFile:", selectedFile)
		if (selectedFile) {
			console.log("[if (selectedFile)] selectedFile:", selectedFile)
			const cipherId = await medusaClient.listings(selectedFile)
			
			setCipherId(cipherId);
			console.log("getCipherId result:", cipherId)
		}
	}

	const decrypt = async () => {

		console.log("decrypt triggered...")
		
		if (isEncrypted === true) {
			
			// call to buyListing

			/* 

			function buyListing(
				string memory _uri,
				G1Point calldata buyerPublicKey
			) external returns (uint256) {
				// Listing memory listing = listings[uri];
				// if (listing.seller == address(0)) {
				//     revert ListingDoesNotExist();
				// }

				// if (ERC721(nft).balanceOf(msg.sender) < 1) {
				//     revert InsufficentFunds();
				// }
				(bool success, bytes memory check) = nft.call(
					abi.encodeWithSignature("balanceOf(address)", msg.sender)
				);

				if (!success || check[0] == 0) {
					revert CallerIsNotNftOwner();
				}

				// _asyncTransfer(listing.seller, msg.value);
				uint256 requestId = oracle.requestReencryption(
					listings[_uri],
					buyerPublicKey
				);
				// emit NewSale(msg.sender, requestId, listings[_uri], _uri);
				requests[_uri] = requestId;
				return requestId;
			}

			*/

			const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer)
			console.log("medusa init:", medusa)

			const medusaPublicKey = await medusa.fetchPublicKey()
			console.log("medusaPublicKey:", medusaPublicKey)

			const keypair = await medusa.signForKeypair()

			console.log("medusa.keypair:", medusa.keypair) // no need

			// const { private, public } = await medusa.generateKeypair();

			// public.toEvm()

			const publicKeyFromContract = await medusaClient.publicKey()
			// console.log("publicKeyFromContract:", publicKeyFromContract)

			// console.log("keypair:", keypair)
			// console.log("keypair.secret:", keypair.secret)
			// console.log("medusa.keypair:", medusa.keypair)

			const uri = selectedFile
			// const buyerPublicKey = medusaPublicKey

			// const { x, y } = keypair.pubkey.toEvm()
    		// const evmPoint = { x, y }

			// const buyerPublicKey = publicKeyFromContract
			const buyerPublicKey = keypair.pubkey

			console.log("uri:", uri)
			console.log("buyerPublicKey:", buyerPublicKey)

			// string memory _uri, G1Point calldata buyerPublicKey
			const buyListing = await medusaClient.buyListing(

				uri,
				buyerPublicKey.toEvm()
				, {
					// value: 1,
					gasLimit: 1000000
				}
			)
			console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + buyListing.hash)

			console.log("buyListing:", buyListing)

			// get requestId

			const getRequestId = await medusaClient.requests(

				uri

			)
			console.log("getRequestId:", getRequestId)



			// At this point, the encryptedKey should be submitted to Medusa as ciphertext.
			// The encryptedData should be stored in a public store like ipfs / Filecoin / Arweave / AWS s3 etc.

			// At a later point, another user would request the encryptedKey to be reencrypted towards themself
			// If that request is valid according to the application's access control policy,
			// the user will fetch the reencrypted key as ciphertext
			// The application should also fetch the encryptedContents from the data store

			// Decrypt encryptedContents using reencrypted ciphertext from Medusa
			// If a user has not signed a message for Medusa yet,
			// this will prompt them to sign a message in order to retrieve their Medusa private key


			const ciphertext = await medusaClient.ciphers(getRequestId)
			console.log("ciphertext:", ciphertext)

			let encryptedData = null

			console.log("Downloading encrypted content from ipfs")
			// const ipfsDownload = ipfsGatewayLink(selectedFile)
			const response = await fetch(selectedFile)
			const encryptedContents = Base64.toUint8Array(await response.text())

			// try {
			// 	const result = await axios.get(selectedFile);
			// 	console.log('result:', result);

			// 	encryptedData = result.data
			// 	console.log('[result.data.result] encryptedData:', encryptedData);


			// } catch (error) {
			// 	console.error('Error getUri: ', error);
			// }


			try {

				const blob = encryptedContents

				const decryptedBytes = await medusa.decrypt(

					ciphertext, // encryptedKey
					blob, // encrypted data/file
	
				)
	
				// console.log('decryptedBytes:', decryptedBytes)
				// const b64EncryptedData = Base64.fromUint8Array(decryptedBytes)
				// setDecryptedFile(b64EncryptedData)

			} catch (error) {
				console.error('Error decrypt: ', error);
			}


			// setIsEncrypted(false)
			

			// setDecryptedFile(decryptedBytes) // placeholder

			// const reader = new FileReader()
			// reader.readAsDataURL(selectedFile)
			// reader.onload = async (event) => {
			// 	const plaintext = event.target?.result as Uint8Array

			// 	const encryptedData = new Uint8Array(plaintext)

			// 	const decryptedBytes = await medusa.decrypt(

			// 	ciphertext, // encryptedKey
			// 	encryptedData, // encrypted data/file

			// )
			// console.log('decryptedBytes:', decryptedBytes);


			

			// }
			// reader.onerror = (error) => {
			// console.log('File Input Error: ', error);
			// }

			
			// const plaintext = new TextDecoder().decode(decryptedBytes) // To decode bytes to UTF-8

			// setDecryptedFile(plaintext) // placeholder
		
		} else {
			setDecryptedFile(selectedFile) // placeholder
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
								await getCipherId(proposals[i].args[8].substring(proposals[i].args[8].indexOf("(") +1 ,proposals[i].args[8].indexOf(")") ))
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
														</p><br />

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
