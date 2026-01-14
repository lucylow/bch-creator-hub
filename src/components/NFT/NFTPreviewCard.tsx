import { useEffect, useState } from "react";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

interface NFTPreviewCardProps {
  uri: string;
}

export default function NFTPreviewCard({ uri }: NFTPreviewCardProps) {
  const [meta, setMeta] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert IPFS URI to HTTP gateway URL
        let url = uri;
        if (uri.startsWith("ipfs://")) {
          url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch metadata: ${res.statusText}`);
        }

        const json = await res.json();
        setMeta(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metadata");
      } finally {
        setLoading(false);
      }
    };

    if (uri) {
      fetchMeta();
    }
  }, [uri]);

  if (loading) {
    return (
      <div className="border rounded-lg p-4 shadow-sm animate-pulse">
        <div className="bg-gray-200 rounded mb-3 h-64 w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 shadow-sm border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">Error loading preview: {error}</p>
        <p className="text-gray-500 text-xs mt-1">URI: {uri}</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="border rounded-lg p-4 shadow-sm">
        <p className="text-gray-500">No metadata available</p>
      </div>
    );
  }

  // Convert IPFS image URL if needed
  const imageUrl = meta.image?.startsWith("ipfs://")
    ? meta.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    : meta.image;

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={meta.name || "NFT"}
          className="rounded mb-3 w-full object-cover max-h-64"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x400?text=NFT+Image";
          }}
        />
      )}
      <h2 className="font-semibold text-lg mb-2">{meta.name || "Unnamed NFT"}</h2>
      {meta.description && (
        <p className="text-sm text-gray-600 mb-3">{meta.description}</p>
      )}
      {meta.attributes && meta.attributes.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-semibold text-gray-500 mb-2">Attributes</p>
          <div className="flex flex-wrap gap-2">
            {meta.attributes.map((attr, idx) => (
              <div
                key={idx}
                className="px-2 py-1 bg-gray-100 rounded text-xs"
              >
                <span className="font-medium">{attr.trait_type}:</span>{" "}
                <span className="text-gray-600">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


