'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Cpu, Upload, Download, ImageIcon, ZapOff } from 'lucide-react'

// Placeholder for Starknet contract interaction
const contractInteraction = {
  proveImage: async (jsonData: any) => {
    console.log('Proving image:', jsonData)
    return { success: true, message: 'Image proved successfully' }
  },
  verifyImage: async (jsonData: any) => {
    console.log('Verifying image:', jsonData)
    return { success: true, message: 'Image verified successfully' }
  }
}

export default function Component() {
  const [proveImage, setProveImage] = useState<string | null>(null)
  const [verifyImage, setVerifyImage] = useState<string | null>(null)
  const [proveResult, setProveResult] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      const resizedImage = await resizeImage(e.target.files[0], 300, 300)
      setProveImage(resizedImage)
    }
  }

  const handleVerifyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => setVerifyImage(e.target?.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const createJsonFromImage = (): { R: number[], G: number[], B: number[], Grayscale?: number[] } => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const R = [], G = [], B = [], Grayscale = []

    for (let i = 0; i < data.length; i += 4) {
      R.push(data[i])
      G.push(data[i + 1])
      B.push(data[i + 2])
      if (grayscaleImage) {
        const avg = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
        Grayscale.push(avg)
      }
    }

    return grayscaleImage ? { R, G, B, Grayscale } : { R, G, B }
  }

  const handleProve = async () => {
    const jsonData = createJsonFromImage()
    const result = await contractInteraction.proveImage(jsonData)
    setProveResult(result.message)
  }

  const handleVerify = async () => {
    if (!verifyImage) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = async () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const R = [], G = [], B = []
      for (let i = 0; i < data.length; i += 4) {
        R.push(data[i])
        G.push(data[i + 1])
        B.push(data[i + 2])
      }
      const jsonData = { R, G, B }
      const result = await contractInteraction.verifyImage(jsonData)
      setVerifyResult(result.message)
    }
    img.src = verifyImage
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
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
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