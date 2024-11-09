'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Cpu, Upload, Download, ImageIcon, ZapOff } from 'lucide-react'
import { Contract, RpcProvider, Account, ec, json, constants, Uint256 , cairo } from 'starknet'

const contractAddress = '0x01ed4e9955ffa136c103b29ca5eb4a3b6b932bc5478d73cd598e6168eecf7652'
const provider = new RpcProvider({ nodeUrl: 'https://starknet-sepolia.public.blastapi.io' })
const privateKey = '0x03449dc0ea11ff93b9f8095a88cc6400d81df63578fb9287323368c0ca3abfe0'
const accountAddress = "0x0407D72924f4fcF8C119f4Bc1C026f98cEfBf35D7804b56Dbd599b39310d0650"
let contract: Contract
let account: Account

export default function StarknetImageProver() {
  const [proveImage, setProveImage] = useState<string | null>(null)
  const [verifyImage, setVerifyImage] = useState<string | null>(null)
  const [proveResult, setProveResult] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const initializeContract = async () => {
      try {
        const { abi } = await provider.getClassAt(contractAddress)
        if (abi) {
          contract = new Contract(abi, contractAddress, provider)
          account = new Account(provider, accountAddress, privateKey, undefined, "0x3")
          
          // Connect the account to the contract
          contract.connect(account)
        } else {
          console.error("ABI not found for the contract")
        }
      } catch (error) {
        console.error("Failed to initialize contract:", error)
      }
    }
    initializeContract()
  }, [])

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL())
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleProveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const resizedImage = await resizeImage(e.target.files[0], 60, 60)
      setProveImage(resizedImage)
    }
  }

  const handleVerifyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // const reader = new FileReader()
      // reader.onload = (e) => setVerifyImage(e.target?.result as string)
      // reader.readAsDataURL(e.target.files[0])
      const resizedImage = await resizeImage(e.target.files[0], 60, 60)
      setVerifyImage(resizedImage)
    }
  }

  const createJsonFromImage = (): { width: number, height: number, R: Uint256[], G: Uint256[], B: Uint256[], Gray: Uint256[] } => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const R = [], G = [], B = [], Gray = []
    const RC = [], GC = [], BC = [], GrayC = []

    for (let i = 0; i < data.length; i += 4) {
      R.push(data[i])
      G.push(data[i + 1])
      B.push(data[i + 2])
      if (data[i] == data[i + 1] && data[i + 1] == data[i + 2]) {
        Gray.push(data[i])
      } else {
        const grayValue = Math.floor((data[i]*299 + data[i + 1]*587 + data[i + 2]*114) / 1000)
        Gray.push(grayValue)
      }
    }

    let counter = 0; 
    let Rstr = ""
    let Gstr = ""
    let Bstr = ""
    let Graystr = ""

    for (let i = 0; i < R.length; i += 1) {
      Rstr += (R[i].toString(16)).slice(-2)
      Gstr += (G[i].toString(16)).slice(-2)
      Bstr += (B[i].toString(16)).slice(-2)
      Graystr += (Gray[i].toString(16)).slice(-2)
      counter += 1;
      if (counter == 30) {
        RC.push(cairo.uint256("0x" + Rstr))
        GrayC.push(cairo.uint256("0x" + Graystr))
        GC.push(cairo.uint256("0x" + Gstr))
        BC.push(cairo.uint256("0x" + Bstr))
        counter = 0
        Rstr = ""
        Gstr = ""
        Bstr = ""
        Graystr = ""
      }
    }

    return { width: canvas.width, height: canvas.height, R: RC, G: GC, B: BC, Gray: GrayC }
  }

  const handleProve = async () => {
    if (!proveImage) return
    const { width, height, R, G, B , Gray} = createJsonFromImage()
    try {
      const result = await contract.prove(width, height, R, G, B)
      setProveResult(`Image proved successfully. Transaction hash: ${result.transaction_hash}`)
    } catch (error) {
      console.error("Error proving image:", error)
      setProveResult("Failed to prove image. Check console for details.")
    }
  }

  const handleVerify = async () => {
    if (!verifyImage) return
    const { width, height, Gray } = createJsonFromImage()
    try {
      const hashResult = await contract.image_hash_grayscale(width, height, Gray)
      
      const verifyResult = await contract.is_verified_get_owner(hashResult)
      if (verifyResult != 0) {
        setVerifyResult(`Image verified. Owner: 0x${verifyResult.toString(16)}`)
      } else {
        setVerifyResult("Image not verified or not found.")
      }
    } catch (error) {
      console.error("Error verifying image:", error)
      setVerifyResult("Failed to verify image. Check console for details.")
    }
  }

  const handleDownload = () => {
    if (grayscaleImage) {
      const link = document.createElement('a')
      link.href = grayscaleImage
      link.download = 'transformed_image_grayscale.png'
      link.click()
    } else if (proveImage) {
      const link = document.createElement('a')
      link.href = proveImage
      link.download = 'transformed_image.png'
      link.click()
    }
  }

  const convertToGrayscale = () => {
    if (!proveImage) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = Math.floor((data[i]*299 + data[i + 1]*587 + data[i + 2]*114) / 1000)
        data[i] = data[i + 1] = data[i + 2] = avg
      }
      ctx.putImageData(imageData, 0, 0)
      setGrayscaleImage(canvas.toDataURL())
    }
    img.src = proveImage
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 p-4 font-mono">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-cyan-300 animate-pulse">VIMz &lt;&gt; STARKs</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <Card className="flex-1 bg-gray-900 border-cyan-400 border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-300 flex items-center gap-2">
                <Cpu className="w-6 h-6" />
                Prove
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <Input type="file" accept="image/*" onChange={handleProveUpload} className="sr-only" id="prove-upload" />
                  <label htmlFor="prove-upload" className="flex items-center justify-center w-full h-12 px-4 transition-colors duration-150 bg-cyan-700 rounded-lg hover:bg-cyan-600 focus:shadow-outline cursor-pointer">
                    <Upload className="w-5 h-5 mr-2" />
                    <span>Upload Image</span>
                  </label>
                </div>
                {proveImage && (
                  <div className="space-y-4">
                    <div className="border-2 border-cyan-400 p-2">
                      <img src={proveImage} alt="Resized" className="mx-auto max-w-full h-auto" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button onClick={handleProve} className="bg-purple-700 hover:bg-purple-600 text-white">
                        <Cpu className="w-4 h-4 mr-2" />
                        Prove
                      </Button>
                      <Button onClick={handleDownload} className="bg-green-700 hover:bg-green-600 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button onClick={convertToGrayscale} className="bg-blue-700 hover:bg-blue-600 text-white">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Grayscale
                      </Button>
                    </div>
                    {grayscaleImage && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-cyan-300">Grayscale Image:</p>
                        <div className="border-2 border-cyan-400 p-2">
                          <img src={grayscaleImage} alt="Grayscale" className="mx-auto max-w-full h-auto" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {proveResult && <p className="text-green-400">{proveResult}</p>}
              </div>
            </CardContent>
          </Card>

          <Separator orientation="vertical" className="h-auto hidden md:block border-l-2 border-cyan-400" />

          <Card className="flex-1 bg-gray-900 border-cyan-400 border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-300 flex items-center gap-2">
                <ZapOff className="w-6 h-6" />
                Verify
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <Input type="file" accept="image/*" onChange={handleVerifyUpload} className="sr-only" id="verify-upload" />
                  <label htmlFor="verify-upload" className="flex items-center justify-center w-full h-12 px-4 transition-colors duration-150 bg-cyan-700 rounded-lg hover:bg-cyan-600 focus:shadow-outline cursor-pointer">
                    <Upload className="w-5 h-5 mr-2" />
                    <span>Upload Image</span>
                  </label>
                </div>
                {verifyImage && (
                  <div className="space-y-4">
                    <div className="border-2 border-cyan-400 p-2">
                      <img src={verifyImage} alt="To Verify" className="mx-auto max-w-full h-auto" />
                    </div>
                    <Button onClick={handleVerify} className="w-full bg-red-700 hover:bg-red-600 text-white">
                      <ZapOff className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                )}
                {verifyResult && <p className="text-green-400">{verifyResult}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}