import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { govAbi, meduasaClientAbi, TALLY_DAO_NAME, MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, MEDUSA_ORACLE_CONTRACT_ADDRESS } from '../lib/consts'
import { ethers } from 'ethers';
import { useState } from "react";
import Link from 'next/link'
import Head from 'next/head'
import { UploadFile } from '../components/UploadFile'
import { UploadData } from '../components/UploadData'
import { useRouter } from 'next/router'
import { Medusa } from "@medusa-network/medusa-sdk"
import { Base64 } from 'js-base64'

const baseUrl = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"

const Editor: FC = () => {

	const [amount, setAmount] = useState("1")
	const [title, setTitle] = useState("One more cool contrib")
	const [beneficiary, setBeneficiary] = useState("0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977")
	const [description, setDescription] = useState("I did this and that...")
	const [encryptionRequested, setEncryptionRequested] = useState(true)
	const [name, setName] = useState(null);
	const [plaintext, setPlaintext] = useState(null)
	const [proposalType, setProposalType] = useState("1")
	
	const router = useRouter()
	const { data: signer, isError, isLoading  } = useSigner()

	const submitProposal = async (e:any) => {

		e.preventDefault();

		console.log("submitProposal triggered")
		console.log("file name:", name)
		console.log("encryptionRequested:", encryptionRequested)

		let fileToAddInDescription:string = ""
		let plaintextString = ""

		if (encryptionRequested === true) {

			try {

				e.preventDefault();

				console.log("encrypt start //////////")

				// Medusa init
				console.log("signer:", signer)

				const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer);
				console.log("medusa:", medusa)

				// prepare medusa client (https://github.com/w3hc/private-doc/blob/main/contracts/PrivateDoc.sol)
				const medusaClient = new ethers.Contract(
					MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
					meduasaClientAbi, 
					signer
				)

				// get plaintextBytes
				plaintextString = plaintext
				console.log("plaintextString:", plaintextString)
				const plaintextBytes = new TextEncoder().encode(plaintextString)
				console.log("plaintextBytes:", plaintextBytes)

				// medusa.encrypt
				const { encryptedData, encryptedKey } = await medusa.encrypt(
					plaintextBytes, 
					MEDUSA_CLIENT_APP_CONTRACT_ADDRESS
				)

				console.log("encryptedData:", encryptedData)
				console.log("encryptedKey:", encryptedKey)		

				// to Base64
				const encryptedDataBase64 = Base64.fromUint8Array(encryptedData)

				// upload (Web3.Storage)
				const ipfsUrl = await UploadData(encryptedDataBase64, name)
				console.log("ipfsUrl:", ipfsUrl)
				fileToAddInDescription = ipfsUrl
				
				console.log("[before medusaCall] encryptedKey", encryptedKey)

				// medusa call
				const medusaCall = await medusaClient.createListing(

					encryptedKey,
					ipfsUrl

				)
				console.log("[after medusaCall] medusaCall:", medusaCall)
				console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + medusaCall.hash)
			
			} catch(e) {
				console.log("error:", e)
			}

		} else {

			console.log("[no encryption] plaintext:", plaintext)
			console.log("[no encryption] name:", name)

			// if encryption is not requested, upload the file to ipfs
			fileToAddInDescription = await UploadFile(plaintext, name)
			console.log("[no encryption] fileToAddInDescription:", fileToAddInDescription)

		}

		try {
			// prepare Gov
			const gov = new ethers.Contract(
				'0x17BccCC8E7c0DC62453a508988b61850744612F3', 
				govAbi, 
				signer
			)

			// prepare calldatas
			const call = "0x"
			const calldatas = [call.toString()]

			// prepare proposal description
			let PROPOSAL_DESCRIPTION: string
			console.log("fileToAddInDescription:", fileToAddInDescription)
			console.log("encryptionRequested:", encryptionRequested)
			console.log("plaintextString:", plaintextString)

			if (fileToAddInDescription) { // won't work if no file attached
				if (plaintextString) {
					PROPOSAL_DESCRIPTION = "" + title + "\n" + description + "\n\n[View attached document](" + fileToAddInDescription + ")"
					if (encryptionRequested) {
						PROPOSAL_DESCRIPTION += " encrypted" /*+ (cipherId === null ? "没有" : cipherId)*/
					} else {
						PROPOSAL_DESCRIPTION = "" + title + "\n" + description + ""
					}
				} else {
					PROPOSAL_DESCRIPTION = "" + title + "\n" + description + ""
				}

			} else {
				PROPOSAL_DESCRIPTION = "" + title + "\n" + description + ""
			}
		
			console.log("PROPOSAL_DESCRIPTION:", PROPOSAL_DESCRIPTION)

			// set targets and values
			const targets = [beneficiary]
			const values = [ethers.utils.parseEther(amount)]

			console.log(amount)
			console.log(description)
			setAmount(amount)

			console.log("encryptionRequested:", encryptionRequested)
			
			// call propose
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
			console.log("Tally link:", baseUrl + proposalId)
			const targetURL = "/proposal/" + proposalId

			router.push(targetURL)

		} catch(e) {
			console.log("error:", e)
		}
	}
			
	const handleFileChange = (event: any) => {
		if (encryptionRequested) {
			console.log("handleFileChange:", event)
			const file = event
			setName(file.name)
			const reader = new FileReader()
			reader.readAsDataURL(file);
			reader.onload = (event) => {
				const plaintext = event.target?.result as string
				setPlaintext(plaintext)
			}
			reader.onerror = (error) => {
				console.log('File Input Error: ', error);
			}
		} else {
			console.log("event:", event)
			const file = event
			setName(file.name)
			setPlaintext(file)
		}
	}
	
	return (
		<>
			<Head>
				<title>Gov Proposal Editor</title>
				<meta name="description" content="Gov Proposal Editor simplifies the proposal submission process leveraging Web3.Storage (IPFS + Filcoin), makes it more adapted to Gov and also intends to add a privacy layer thanks to Medusa Network." />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="./favicon.ico" />
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
						<br /> <br /> <br /> 
					</div>

					<div className="grid max-w-lg gap-6 mb-10 ml-20 md:grid-cols-1">
						
						<select 
							id="proposalTypes" 
							className="max-w-xs block w-full p-2 mb-2 text-sm text-gray-900 border border-blue-300 rounded-lg bg-blue-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							onChange={(e) => setProposalType(e.target.value)} 
						>
							<option selected value ="1">Request funding</option>
							<option  value="2">Add a member</option>
							<option disabled value="3">Ban a member</option>
							<option disabled value="4">Update manifesto</option>
							<option disabled value="5">Update NFT metadata</option>
							<option disabled value="6">Update website</option>
							<option disabled value="7">Custom</option>
						</select>
						
					</div>
						
					{proposalType === "1" && <><form>
						<div className="grid gap-6 mb-6 md:grid-cols-1" >
							<div>
								<div className="justify-center flex ">
									<div>
										<label style={{width:"100%"}} htmlFor="title" className=" justify-center flexblock mb-2 text-sm font-medium text-gray-900 dark:text-white">Proposal title</label>
										<input 
											className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
											style={{minWidth:"400px"}}
											type="text" 
											id="amount" 
											placeholder="Yet another cool contrib" 
											required
											value={title}
											onChange={e => setTitle(e.target.value)}
										/>
									</div>
								</div>
							</div>

							<div className="grid gap-6 mb-6 md:grid-cols-1" >
								<div>
									<div className="justify-center flex ">
										<div>
											<label style={{width:"100%"}} htmlFor="amount" className=" justify-center flexblock mb-2 text-sm font-medium text-gray-900 dark:text-white">
											Amount (in ETH)
											</label>
											<input 
												className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
												style={{minWidth:"400px"}}
												type="number" 
												id="amount" 
												placeholder="0.0001" 
												required
												value={amount}
												onChange={e => setAmount(e.target.value)} // https://beta.reactjs.org/reference/react-dom/components/input
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="grid gap-6 mb-6 md:grid-cols-1" >
								<div>
									<div className="justify-center flex ">
										<div>
											<label style={{width:"100%"}} htmlFor="beneficiary" className=" justify-center flexblock mb-2 text-sm font-medium text-gray-900 dark:text-white">
											Target address (beneficiary)
											</label>
											<input 
												className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
												style={{minWidth:"400px"}}
												type="text" 
												id="beneficiary" 
												placeholder="0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977" 
												required
												value={beneficiary}
												onChange={e => setBeneficiary(e.target.value)} // https://beta.reactjs.org/reference/react-dom/components/input
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="justify-center flex ">
								<div>
									<label style={{width:"100%"}} htmlFor="message" className=" block text-sm font-medium text-gray-900 dark:text-white">
									Description
									</label>
									<textarea 
										id="message"  
										className="  block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
										placeholder="I made a cool contrib! "
										required
										value={description}
										onChange={e => setDescription(e.target.value)}
										style={{minWidth:"400px", width:"100%"}}
									>
									</textarea>
								</div>
							</div>
						</div>

						<div className="justify-center flex ">
							<div>
								<label style={{minWidth:"400px", width:"100%"}} className="block text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">Attached document</label>
								<input
									className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" 
									id="file_input" 
									type="file"
									style={{minWidth:"400px", width:"100%"}}
									onChange={(e) => handleFileChange(e.target.files[0])}
								/>
								<div className="flex items-center">
									<input 
										defaultChecked
										id="encryption-requested" 
										type="checkbox" 
										value="encryptionRequested" 
										className="w-4 h-4 text-red-600 bg-white-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-white-800 focus:ring-2 dark:bg-white-700 dark:border-red-600" 
										onChange={e => setEncryptionRequested(e.target.checked)}
									/>
									<label htmlFor="checked-checkbox" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Only accessible to the DAO members</label>
								</div>
							</div>
						</div>
						<br />
						<div className="flex justify-center">

							<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
							onClick={submitProposal}>
							Submit
							</button> 

						</div>
					</form></>}	
					{proposalType === "2" && 
					<>
						<form>
							<div className="grid gap-6 mb-6 md:grid-cols-1" >
								<div>
									<div className="justify-center flex ">
										<div>
											<p>Hello!</p>
										</div>
									</div>
							</div>
						</div>
					</form></>}
				</div>
			</div>
		</>
	)
}

export default Editor
