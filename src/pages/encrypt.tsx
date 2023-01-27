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
import { Medusa } from "@medusa-network/medusa-sdk";
import { Wallet } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Base64 } from 'js-base64'


const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL

const Home: FC = () => {

	const [err, setErr] = useState(false)
	const [result, setResult] = useState("")
	
	const { data, error, isLoading, refetch } = useSigner()

	// const gov = new ethers.Contract('0x690C775dD85365a0b288B30c338ca1E725abD50E', govAbi, data)

	const handleFileInput = async () => {
		console.log("handleFileInput triggered")
		
		// console.log("file:", selectedFile)
		// console.log("file name:", selectedFile.name)

		const medusaAddress = "0xf1d5A4481F44fe0818b6E7Ef4A60c0c9b29E3118";
		const provider = new JsonRpcProvider(endpoint);
	
		// const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
	
		// const signer = provider.getSigner(0)

		console.log(data)
	
		const medusa = await Medusa.init(medusaAddress, data);

		const msg = new TextEncoder().encode("hello")

		// const { encryptedData, encryptedBlob, encryptedCipherkey }:any = await medusa.encrypt(
		const { encryptedBlob, encryptedCipherkey }:any = await medusa.encrypt(
				msg, 
			"0xd84dA33Fe16E3B5448f1E95cD252E202Ab33D1eB" // PrivateDoc contract (Medusa client): https://github.com/w3hc/private-doc
			);

		// const b64EncryptedData = Base64.fromUint8Array(encryptedData)

		// console.log("Encrypted KEY: ", encryptedData);
		// console.log("b64EncryptedData: ", b64EncryptedData);

		console.log("encryptedBlob:", encryptedBlob )
		console.log("encryptedCipherkey:", encryptedCipherkey )

		setResult(encryptedBlob)

	}

	const submitProposal = async (e:any) => {
		
		try {
			
			e.preventDefault();

			handleFileInput()

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
								{result != "" ? <div>
									<h1>{result}</h1>
								</div> : 
								<div>
								<h1> </h1>
							</div>
								}
							</div>
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
