import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
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
import { Base64 } from 'js-base64'

const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
// const provider = new ethers.providers.JsonRpcProvider(endpoint)
const baseUrl = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"

const MedusaPlayground: FC = () => {

	const [amount, setAmount] = useState("1")
	const [title, setTitle] = useState("")
	const [beneficiary, setBeneficiary] = useState("0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977")
	const [description, setDescription] = useState("")
	const [encryptionRequested, setEncryptionRequested] = useState(true);
	const [name, setName] = useState(null);
	const [plaintext, setPlaintext] = useState(null);
	const [encryptedFileIPFSUrl, setEncryptedFileIPFSUrl] = useState(null);
	
	const router = useRouter();
	const { data: signer, isError, isLoading  } = useSigner({  onError(error) {  console.log('my Error', error)   },   })

	const encrypt = async (e:any) => {
		
		/*

		Order of operations

		# --- Alice encrypts and uploads
		const plaintextString = 'Some data to store'
		const plaintextBytes = TextEncoder.encode(plaintextString)
		const { encryptedData } = medusa.encrypt(...)
		const encryptedDataBase64 = Base64.fromUint8Array(encryptedData)
		uploadFile(encryptedDataBase64)

		*/

		e.preventDefault();

		console.log("submitProposal triggered")
		console.log("file name:", name)
		console.log("encryptionRequested:", encryptionRequested)

		console.log("encrypt start")

		const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer);
		console.log("medusa:", medusa)

		const plaintextString = 'My secret'
		// const plaintextBytes = TextEncoder.encode(plaintextString)
		const plaintextBytes = new TextEncoder().encode(plaintextString)
		const { encryptedData, encryptedKey } = await medusa.encrypt(plaintextBytes, MEDUSA_CLIENT_APP_CONTRACT_ADDRESS)
		// const { encryptedData } = await medusa.encrypt(plaintextBytes, MEDUSA_CLIENT_APP_CONTRACT_ADDRESS)

		console.log("encryptedData:", encryptedData)
		// console.log("encryptedKey:", encryptedKey)
		const encryptedDataBase64 = Base64.fromUint8Array(encryptedData)

		const encryptedFileIPFSUrl = await UploadData(encryptedDataBase64, 'test.md')
		console.log("encryptedFileIPFSUrl:", encryptedFileIPFSUrl)
		setEncryptedFileIPFSUrl(encryptedFileIPFSUrl)

		// prepare medusa client
		const medusaClient = new ethers.Contract(
			MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
			meduasaClientAbi, 
			signer
		)

		// medusa call
		const createListing = await medusaClient.createListing(encryptedKey, encryptedFileIPFSUrl)

		const createListingTx = await createListing.wait()
		console.log("result:", createListingTx)

		console.log("createListing:", createListing)
		console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + createListing.hash)

		console.log("encrypt done")

	}

	const decrypt = async (e:any) => {

		/*

		Order of operations

		# --- Bob downloads and decrypts
		const encryptedDataBase64 = downloadFile(uri)
		const encryptedData = Base64.toUint8Array(encryptedDataBase64)
		const plaintextBytes = medusa.decrypt(...)
		const plaintextString = TextDecoder.decode(plaintextBytes)

		*/
		e.preventDefault();

		console.log("decrypt start")
		
		const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer);
		console.log("medusa:", medusa)

		const keypair = await medusa.signForKeypair()
		const { x, y } = keypair.pubkey.toEvm()
		const evmPoint = { x, y }
		const buyerPublicKey:EVMG1Point = evmPoint
		console.log("buyerPublicKey:", buyerPublicKey)

		return
		
		const encryptedDataBase64 = fetch(encryptedFileIPFSUrl)

		// prepare medusa client
		const medusaClient = new ethers.Contract(
			MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
			meduasaClientAbi, 
			signer
		)

		const buyListing = await medusaClient.buyListing( encryptedFileIPFSUrl, "keypair")

		console.log("buyListing.blockNumber:", buyListing.block )

		console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + buyListing.hash )
		const buyListingTx = await buyListing.wait()
		console.log("buyListingTx:", buyListingTx )

		// const encryptedDataBase64 = await fetch(encryptedFileIPFSUrl)

		

		console.log("encryptedDataBase64:", encryptedDataBase64)
		
		const encryptedData = Base64.toUint8Array(encryptedDataBase64)

		console.log("buyListingTx.blockNumber:", buyListingTx.blockNumber)
		const ciphertext = await medusaClient.queryFilter( "ListingDecryption", buyListingTx.blockNumber -1 )
		// console.log("ciphertext:", ciphertext[0].args.ciphertext)
		console.log("ciphertext:", ciphertext)
		const plaintextBytes2 = await medusa.decrypt(
			encryptedKey, // encryptedKey
			encryptedData, // encrypted data/file
		) // error: "Called `_unsafeUnwrap` on an Err"

		// const plaintextString2 = new TextDecoder().decode(plaintextBytes)

		console.log("plaintextBytes2:", plaintextBytes2)

	}

	// const handleFileChange = (event: any) => {
	// 	if (encryptionRequested) {
	// 		console.log("File uploaded successfully!")
	// 		const file = event
	// 		setName(file.name)
	// 		const reader = new FileReader()
	// 		reader.readAsDataURL(file);
	// 		reader.onload = (event) => {
	// 			const plaintext = event.target?.result as string
	// 			setPlaintext(plaintext)
	// 		}
	// 		reader.onerror = (error) => {
	// 		console.log('File Input Error: ', error);
	// 	}
	// 	} else {
	// 		console.log("event:", event)
	// 		const file = event
	// 		setName(file.name)
	// 		setPlaintext(file)
	// 	}
	// }
	
	return (
		<>
			<Head>
				<title>Medusa Playground</title>
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
						<div className="flex justify-center">

							<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded" 
							onClick={encrypt}>
							Encrypt
							</button> 
							<button className="bg-transparent hover:bg-pink-500 text-pink-700 font-semibold hover:text-white py-2 px-4 mt-200 border border-pink-500 hover:border-transparent rounded ml-4" 
							onClick={decrypt}>
							Decrypt
							</button>

						</div>
						
					</form>	
				</div>
			</div>
		</>
	)
}

export default MedusaPlayground
