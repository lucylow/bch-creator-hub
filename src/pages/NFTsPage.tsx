import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import MintForm from '@/components/NFT/MintForm';
import BuyNFT from '@/components/NFT/BuyNFT';
import NFTGallery from '@/components/NFT/NFTGallery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NFTsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
        <p className="text-muted-foreground">
          Mint, buy, and manage your NFTs on the BCH Creator Hub
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <ConnectButton />
      </div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="mint">Mint</TabsTrigger>
          <TabsTrigger value="buy">Buy</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-6">
          <NFTGallery />
        </TabsContent>

        <TabsContent value="mint" className="mt-6">
          <MintForm />
        </TabsContent>

        <TabsContent value="buy" className="mt-6">
          <BuyNFT />
        </TabsContent>
      </Tabs>
    </div>
  );
}

