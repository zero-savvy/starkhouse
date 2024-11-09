'use client'

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toPng } from 'html-to-image'
import { saveAs } from 'file-saver'
import { Sword, Download, Upload, X } from 'lucide-react'

type ImageCell = {
  id: number
  src: string
} | null

export default function Component() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [gridImages, setGridImages] = useState<ImageCell[]>(Array(9).fill(null))
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 9))
    }
  }

  const handleImageSelect = (index: number) => {
    if (!isImagePlaced(index)) {
      setSelectedImage(index)
    }
  }

  const handleCellClick = (cellIndex: number) => {
    if (selectedImage !== null) {
      const newGridImages = [...gridImages]
      newGridImages[cellIndex] = { id: selectedImage, src: uploadedImages[selectedImage] }
      setGridImages(newGridImages)
      setSelectedImage(null)
    }
  }

  const handleRemoveImage = (cellIndex: number) => {
    const newGridImages = [...gridImages]
    newGridImages[cellIndex] = null
    setGridImages(newGridImages)
  }

  const isImagePlaced = (imageIndex: number) => {
    return gridImages.some(cell => cell && cell.id === imageIndex)
  }

  const handleMerge = async () => {
    if (gridRef.current) {
      try {
        const dataUrl = await toPng(gridRef.current, { quality: 1.0 })
        saveAs(dataUrl, 'dota2_merged_image.png')
      } catch (error) {
        console.error('Error merging images:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 flex flex-col items-center">
      <h1 className="text-5xl font-bold text-red-500 mb-8 font-serif tracking-wide">NFT Hero Forge</h1>
      <div className="flex flex-wrap justify-center gap-8">
        <Card className="p-6 bg-gray-800 border-4 border-red-700 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-red-400 mb-4 flex items-center">
            <Sword className="mr-2" /> NFT Grid
          </h2>
          <div 
            ref={gridRef}
            className="grid grid-cols-3 gap-0 w-[600px] h-[600px] bg-gray-700 border-4 border-red-600 rounded-md overflow-hidden"
            style={{
              boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)',
              backgroundImage: 'url("/placeholder.svg?height=600&width=600")',
              backgroundSize: 'cover',
              backgroundBlendMode: 'overlay'
            }}
          >
            {gridImages.map((cell, index) => (
              <div
                key={index}
                className={`w-[200px] h-[200px] border border-red-500 flex items-center justify-center relative cursor-pointer ${selectedImage !== null ? 'hover:bg-red-500 hover:bg-opacity-30' : ''}`}
                onClick={() => handleCellClick(index)}
              >
                {cell ? (
                  <>
                    <img
                      src={cell.src}
                      alt={`Grid image ${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(index)
                      }}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <span className="text-red-300 text-opacity-50">
                    {selectedImage !== null ? 'Click to place' : 'Empty'}
                  </span>
                )}
              </div>
            ))}
          </div>
          <Button 
            onClick={handleMerge} 
            className="mt-4 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
          >
            <Download className="mr-2" /> Forge Hero
          </Button>
        </Card>
        <Card className="p-6 bg-gray-800 border-4 border-red-700 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-red-400 mb-4 flex items-center">
            <Upload className="mr-2" /> NFT Arsenal
          </h2>
          <label className="flex items-center justify-center w-full mb-4 cursor-pointer bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            <Upload className="mr-2" />
            <span>Upload Decrepted NFT Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((src, index) => (
              <div 
                key={index} 
                className={`relative group ${
                  isImagePlaced(index) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                } ${selectedImage === index ? 'ring-4 ring-red-500' : ''}`}
                onClick={() => handleImageSelect(index)}
              >
                <img
                  src={src}
                  alt={`Uploaded image ${index}`}
                  className="w-[200px] h-[200px] object-cover rounded-md transition duration-300 ease-in-out transform group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-black bg-opacity-50 ${
                  isImagePlaced(index) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity duration-300 rounded-md flex items-center justify-center`}>
                  <span className="text-white text-lg font-bold">
                    {isImagePlaced(index) ? 'In Use' : 'Select'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}