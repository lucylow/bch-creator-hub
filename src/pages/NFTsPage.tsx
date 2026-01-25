import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, BarChart2, Link2, Settings } from 'lucide-react';
import MintForm from '@/components/NFT/MintForm';
import BuyNFT from '@/components/NFT/BuyNFT';
import NFTGallery from '@/components/NFT/NFTGallery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Breadcrumbs from '@/components/Common/Breadcrumbs';

export default function NFTsPage() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs />
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-2">NFT Marketplace</h1>
        <p className="text-muted-foreground mb-4">
          Mint, buy, and manage your NFTs on the BCH Creator Hub
        </p>
        
        {/* Quick Navigation Links */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/links">
            <Button variant="outline" size="sm" className="gap-2">
              <Link2 className="w-4 h-4" />
              Payment Links
            </Button>
          </Link>
          <Link to="/analytics">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart2 className="w-4 h-4" />
              Analytics
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </div>
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

