import { FC } from 'react'
import ConnectWallet from '@/components/ConnectWallet'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useSigner } from 'wagmi'
import { govAbi, TALLY_DAO_NAME } from '../../../lib/consts'
import { ethers } from 'ethers';
import { useState } from "react";
import Link from 'next/link'
import Head from 'next/head'
import { UploadFile } from '../../../components/UploadFile'
import { useRouter } from 'next/router'

const endpoint = process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ENDPOINT_URL
const provider = new ethers.providers.JsonRpcProvider(endpoint)

const Proposal: FC = () => {

    const router = useRouter()
    const proposalId = router.query.proposalId as string
    // const proposalId = "25594979890771732277263490866077345389024188622088333016531046445084845831759"
    const tallyLink = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"+proposalId+""
    console.log("tallyLink:", tallyLink)

	const [err, setErr] = useState(false)
	const [amount, setAmount] = useState("")
	const [title, setTitle] = useState("")
	const [beneficiary, setBeneficiary] = useState("")
	const [description, setDescription] = useState("")
	const [selectedFile, setSelectedFile] = useState(null);

	const { data, error, isLoading, refetch } = useSigner()
	const gov = new ethers.Contract('0x17BccCC8E7c0DC62453a508988b61850744612F3', govAbi, data)

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
					
				
					<div className="grid gap-6 mb-6 md:grid-cols-1" >
						<div>
							<div className="justify-center flex ">
								<div>
                                    
									<label style={{width:"100%"}} htmlFor="title" className=" justify-center flexblock mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        {proposalId}
                                    </label><br /><br />

                                    <p>[Title]</p><br />
									<p>[Description]</p><br />
                                    <p>[attached document]</p><br />

								</div>
							</div>
						</div>

					</div>
			

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
				</div>
			</div>
		</>
	)
}

export default Proposal
