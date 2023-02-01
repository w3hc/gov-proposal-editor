import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction, useNetwork, useSigner } from 'wagmi'
import { govAbi, meduasaClientAbi, TALLY_DAO_NAME, MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, MEDUSA_ORACLE_CONTRACT_ADDRESS } from '../lib/consts'
import { ethers } from 'ethers';
import { useState, useEffect } from "react";
import Link from 'next/link'
import Head from 'next/head'
import { UploadFile } from '../components/UploadFile'
import { UploadData } from '../components/UploadData'
import { useRouter } from 'next/router'
import { Medusa, EVMG1Point, SuiteType } from "@medusa-network/medusa-sdk"
// import { Base64 } from "js-base64"
import { HGamalEVMCipher } from '@medusa-network/medusa-sdk'
import toast from 'react-hot-toast'
import { parseEther } from 'ethers/lib/utils'

const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
const provider = new ethers.providers.JsonRpcProvider(endpoint)
const baseUrl = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"

const Editor: FC = () => {

	const router = useRouter();

	const [err, setErr] = useState(false)
	const [amount, setAmount] = useState("")
	const [title, setTitle] = useState("")
	const [beneficiary, setBeneficiary] = useState("")
	const [description, setDescription] = useState("")
	const [selectedFile, setSelectedFile] = useState(null);
	const [encryptionRequested, setEncryptionRequested] = useState(true);
	const [cypherId, setCypherId] = useState(null);
	const [ciphertextKey, setCiphertextKey] = useState<HGamalEVMCipher>()
	const [signer, setSigner] = useState(null)
	
	const { chain } = useNetwork()

	const { config, error: prepareError, isError: isPrepareError, isSuccess: readyToSendTransaction } = usePrepareContractWrite({
		address: MEDUSA_CLIENT_APP_CONTRACT_ADDRESS,
		abi: meduasaClientAbi,
		functionName: 'createListing',
		args: [ciphertextKey, "yo", "yo", parseEther('0.00'), "https://bafybeifleelltjnvjgjwjnj4apca33trwcm2hieecwufk2kfp6wppqkqsu.ipfs.w3s.link/aztec-intro.png"],
		enabled: Boolean("bafybeifleelltjnvjgjwjnj4apca33trwcm2hieecwufk2kfp6wppqkqsu") && Boolean(chain),
		chainId: chain?.id
	  })  
	
	const { data, error, isError, write: createListing } = useContractWrite(config)

	// useEffect(() => {
	// 	if (readyToSendTransaction) {
	// 	  toast.loading("Submitting secret to Medusa...")
	// 	  createListing?.()
	// 	//   setCid('')
	// 	}
	//   }, [readyToSendTransaction]);

	const giveKey = async (encryptedKey:HGamalEVMCipher) => {

		// console.log("giveKey triggered:", encryptedKey)

		// console.log("signer:", data)

		// const medusaClient = new ethers.Contract(MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, meduasaClientAbi, signer)

		// const price = '1.00'
		// const cid = "dddddd"
		// const num = 1
		
		try {
		// 	const medusaCall =await medusaClient.createListing(
		// 		encryptedKey,
		// 		"hello",
		// 		"desc desc desc desc desc",
		// 		num,
		// 		"ipfs://xxxx"
		// 		// ,{gasLimit: 21000}
		// 		,{gasLimit: 42000}
		// 	)
	
			// setCypherId(medusaCall)
			// console.log("medusaCall:", medusaCall)
		} catch(e) {
			console.error("error:", e)
		}		
	}
		

	const encryptSelectedFile = async (selectedFile:any) => {

		// const medusaOracleAddress = MEDUSA_ORACLE_CONTRACT_ADDRESS
		// // const provider = new ethers.providers.Web3Provider(window.ethereum);
    	// // const signer = provider.getSigner(0);
		// const medusa = await Medusa.init(medusaOracleAddress, signer);
		// console.log("medusa:", medusa)

		// const medusaPublicKey = await medusa.fetchPublicKey()
		// console.log("medusaPublicKey:", medusaPublicKey)
		// const keypair = await medusa.signForKeypair()
		// console.log("keypair:", keypair)

		// const reader = new FileReader()

    	// reader.readAsDataURL(selectedFile)

		// reader.onload = async (event) => {
		// 	const buffer = event.target?.result as string
		// 	const buff = new TextEncoder().encode(buffer)
		// 	const { encryptedData, encryptedKey } = await medusa.encrypt(
		// 		buff,
		// 		MEDUSA_CLIENT_APP_CONTRACT_ADDRESS,
		// 	);
		// 	console.log("encryptedData:", encryptedData)
		// 	console.log("encryptedKey:", encryptedKey)

		// 	await giveKey(encryptedKey)

		// 	return encryptedData
		// }

		// reader.onerror = (error) => {
		// 	console.log('File Input Error: ', error);
		// };

		console.log("selectedFile:", selectedFile)
	}

	const handleFileInput = async () => {
		console.log("handleFileInput triggered")
		console.log("file:", selectedFile)
		console.log("file name:", selectedFile.name)
		console.log("encryptionRequested:", encryptionRequested)

		if (encryptionRequested === true) {

			const encryptedData = await encryptSelectedFile(selectedFile)
			console.log("selectedFile.name:", selectedFile.name)

			const encryptedFileUrl = await UploadData(encryptedData, selectedFile.name)
			console.log("[editor] encryptedFileUrl:", encryptedFileUrl)
			return encryptedFileUrl

		} else {
			return UploadFile(selectedFile)
		}
	}

	const submitProposal = async (e:any) => {
		
		try {
			
			e.preventDefault();

			const call = "0x"
			const calldatas = [call.toString()]

			let attachedDocumentLink:string
			let PROPOSAL_DESCRIPTION: string

			if (selectedFile) {
				attachedDocumentLink = await handleFileInput()
				PROPOSAL_DESCRIPTION = "" + title + "\n" + description + "\n\n[View attached document](" + attachedDocumentLink + ")"

				if (encryptionRequested) PROPOSAL_DESCRIPTION += " encrypted:" + cypherId

			} else {
				PROPOSAL_DESCRIPTION = "" + title + "\n" + description + ""
			}

			console.log("PROPOSAL_DESCRIPTION:", PROPOSAL_DESCRIPTION)

			const targets = [beneficiary]
			const values = [ethers.utils.parseEther(amount)]

			console.log(amount)
			console.log(description)
			console.log("submitProposal triggered")
			setAmount(amount)

			console.log("encryptionRequested:", encryptionRequested)
			
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
			// console.log("Tally link:", baseUrl + proposalId)
			// const targetURL = "/proposal/"+proposalId

			// router.push(targetURL)
			toast.success(
				<a
				  className="inline-flex items-center text-blue-600 hover:underline"
				  target="_blank"
				  rel="noreferrer"
				>
				  Success!
				  <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
				</a>
		
			  )

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
					<br /> <br /> <br /> <br /> 
				</div>
					
				<form>
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
								onChange={(e) => setSelectedFile(e.target.files[0])}
							/>
							<div className="flex items-center">
								<input 
									defaultChecked
									id="encryption-requested" 
									type="checkbox" 
									value="" 
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

					{err == true && 
						<><br />
							<div className="flex justify-center">
								<p className="text-red-500"><strong>You can&apos;t do that, my friend!</strong> 😿</p>
							</div>
						</>
					}
					</form>	
				</div>
			</div>
		</>
	)
}

export default Editor
