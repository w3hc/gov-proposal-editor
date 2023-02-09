import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { meduasaClientAbi, MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, MEDUSA_ORACLE_CONTRACT_ADDRESS } from '../lib/consts'
import { ethers } from 'ethers';
import { useState } from "react";
import Link from 'next/link'
import Head from 'next/head'
import { UploadData } from '../components/UploadData'
import { useRouter } from 'next/router'
import { Medusa, EVMG1Point } from "@medusa-network/medusa-sdk"
import { Base64 } from 'js-base64'

const MedusaPlayground: FC = () => {

	// const [encryptedFileIPFSUrl, setEncryptedFileIPFSUrl] = useState(null);
	const [isDecrypted, setIsDecrypted] = useState("")
	const [isEncrypted, setIsEncrypted] = useState("")
	const [url, setUrl] = useState("")
	const [myData, setMyData] = useState<Uint8Array>(null)
	
	const { data: signer, isError, isLoading  } = useSigner()

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

		console.log("encrypt start //////////")

		// Medusa init
		const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer);
		console.log("medusa:", medusa)

		// prepare medusa client (https://github.com/w3hc/private-doc/blob/main/contracts/PrivateDoc.sol)
		const medusaClient = new ethers.Contract(
			MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
			meduasaClientAbi, 
			signer
		)

		// get plaintextBytes
		const plaintextString = 'My super secret'
		const plaintextBytes = new TextEncoder().encode(plaintextString)
		console.log("plaintextBytes:", plaintextBytes)

		// medusa.encrypt
		const { encryptedData, encryptedKey } = await medusa.encrypt(
			plaintextBytes, 
			MEDUSA_CLIENT_APP_CONTRACT_ADDRESS
		)
		console.log("encryptedData:", encryptedData)
		console.log("encryptedKey:", encryptedKey)		
		setMyData(encryptedData)

		// to Base64
		const encryptedDataBase64 = Base64.fromUint8Array(encryptedData)
		setIsEncrypted(encryptedDataBase64)

		// upload (Web3.Storage)
		const ipfsUrl = await UploadData(encryptedDataBase64, 'test.md')
		console.log("ipfsUrl:", ipfsUrl)
		setUrl(ipfsUrl)

		// createListing call
		const createListing = await medusaClient.createListing(encryptedKey, ipfsUrl)
		const createListingTx = await createListing.wait()
		console.log("result:", createListingTx)
		console.log("createListing:", createListing)
		console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + createListing.hash)

		console.log("✅ encrypt done")
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

		console.log("decrypt start //////////")
		
		console.log("myData:", myData)
		console.log("url:", url)

		// Medusa init
		const medusa = await Medusa.init(MEDUSA_ORACLE_CONTRACT_ADDRESS, signer);
		console.log("medusa:", medusa)

		// get buyer public key
		const keypair = await medusa.signForKeypair()
		const buyerPublicKey = keypair.pubkey.toEvm()
		console.log("buyer public key:", buyerPublicKey)

		// prepare medusa client (https://github.com/w3hc/private-doc/blob/main/contracts/PrivateDoc.sol)
		const medusaClient = new ethers.Contract(
			MEDUSA_CLIENT_APP_CONTRACT_ADDRESS, 
			meduasaClientAbi, 
			signer
		)

		// get publicKey from contract (unused)
		const pubKeyFromContract = await medusaClient.publicKey()
		console.log("pubKeyFromContract:", pubKeyFromContract)

		// buyListing call
		console.log("url:", url)
		const buyListing = await medusaClient.buyListing( url, buyerPublicKey)
		console.log("Waiting for 5 confirmations...")
		const buyListingTx = await buyListing.wait(5) // needed, otherwise ciphertext returns null
		console.log("buyListing.blockNumber:", buyListing.blockNumber)
		console.log("tx hash:", "https://goerli.arbiscan.io/tx/" + buyListing.hash)
		console.log("buyListingTx:", buyListingTx )

		// get requestId from url
		const requestId = await medusaClient.requests(url)
		const requestIdFormatted = parseInt(requestId)

		// get ciphertext from mapping (requestId)
		const ciphertext = await medusaClient.ciphers(requestIdFormatted)
		console.log("ciphertext:", ciphertext)

		// download and read encrypted data from url
		const myBlob = await fetch(url)
		let result = null
		if (myBlob.ok) { result = await myBlob.text() }
		console.log("myBlob", myBlob)
		console.log("result", result)
		const blob = Base64.toUint8Array(result)
		console.log("blob:", blob)

		// medusa.decrypt
		const plaintextBytes = await medusa.decrypt( 
			ciphertext,
			blob,
		)

		// from bytes to plaintext
		const plaintextString = new TextDecoder().decode(plaintextBytes)
		console.log("plaintextString:", plaintextString)
		setIsDecrypted(plaintextString)

		console.log("✅ decrypt done")
	}
	
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
						<br /> <br /> <br /> <br /> <br /> <br /> 
					</div>
					{isDecrypted !== "" ?
					<>
						<div className="grid gap-6 mb-6 md:grid-cols-1" >
							<div className="justify-center flex ">
								<p>{isDecrypted}</p>
								<br /> <br /> <br />
							</div>
						</div>
					</> :
					
					(isEncrypted !== "" ?
					<>
						<div className="grid gap-6 mb-6 md:grid-cols-1" >
							<div className="justify-center flex ">
								<p>{isEncrypted}</p>
								<br /> <br /> <br />
							</div>
						</div>
					</> : 
					<>
						<div className="grid gap-6 mb-6 md:grid-cols-1" >
							<div className="justify-center flex ">
								<p> </p>
								<br /> <br /> <br />
							</div>
						</div>
					</>)}
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
