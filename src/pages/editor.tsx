import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { govAbi } from '../lib/consts'
import { ethers } from 'ethers';
import { useState } from "react";
import Link from 'next/link'
import Head from 'next/head'
import { UploadFile } from '../components/UploadFile'

const endpoint = 'https://goerli.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_ID
const provider = new ethers.providers.JsonRpcProvider(endpoint)

const Home: FC = () => {

	const [err, setErr] = useState(false)
	const [amount, setAmount] = useState("")
	const [title, setTitle] = useState("")
	const [beneficiary, setBeneficiary] = useState("")
	const [description, setDescription] = useState("")
	const [selectedFile, setSelectedFile] = useState(null);

	const { data, error, isLoading, refetch } = useSigner()
	const gov = new ethers.Contract('0x690C775dD85365a0b288B30c338ca1E725abD50E', govAbi, data)

	const handleFileInput = async () => {
		console.log("handleFileInput triggered")
		console.log("file:", selectedFile)
		console.log("file name:", selectedFile.name)
		return UploadFile(selectedFile)
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
			console.log("Tally link:", "https://www.tally.xyz/gov/girlygov-64/proposal/" + proposalId)

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
						</div>
					</div>

					{err == false ? 

					<div className="flex justify-center">

						<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-10 border border-pink-500 hover:border-transparent rounded" 
						onClick={submitProposal}>
						Submit
						</button> 

					</div> : 

					<div className="flex justify-center">
						<p className="text-red-500"><strong>You can&apos;t do that, my friend!</strong> 😿</p>
					</div>

					}
					</form>	
				</div>
			</div>
		</>
	)
}

export default Home
