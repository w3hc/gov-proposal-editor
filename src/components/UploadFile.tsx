import { Web3Storage } from "web3.storage"

export const UploadFile = async (selectedFile:any, fileName:any) => {

    console.log("uploding your file...")

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
    console.log("✅ url:", "ipfs://" + cid + "/" + fileName)

    // return "https://" + cid + ".ipfs.w3s.link"
    return "ipfs://" + cid + "/" + fileName + ""
}