import { Web3Storage } from "web3.storage"

export const UploadData = async (selectedFile:any) => {

    // prepare storage
    function getAccessToken() {
        return process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN
    }

    function makeStorageClient() {
        return new Web3Storage({ token: getAccessToken() || "" })
    }

    async function storeFile(selectedFile:any) {
        const client = makeStorageClient()
        const put = await client.put([selectedFile], { wrapWithDirectory:false })
        return put
    }

    const cid = await storeFile(selectedFile)

    console.log("✅ cid:", cid)
    console.log("✅ url:", "https://" + cid + ".ipfs.w3s.link")

    return "https://" + cid + ".ipfs.w3s.link"
}