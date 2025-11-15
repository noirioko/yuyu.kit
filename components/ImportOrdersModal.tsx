'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface ImportOrdersModalProps {
  userId: string;
  onClose: () => void;
}

interface ParsedAsset {
  title: string;
  url: string;
  thumbnailUrl?: string;
  price?: number;
  currency?: string;
  platform?: string;
}

export default function ImportOrdersModal({ userId, onClose }: ImportOrdersModalProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedAssets, setParsedAssets] = useState<ParsedAsset[]>([]);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!htmlContent.trim()) {
      alert('Please paste your data first');
      return;
    }

    setParsing(true);
    setError('');
    try {
      const trimmed = htmlContent.trim();

      // Try parsing as JSON first
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        console.log('📋 Detected JSON input, parsing directly...');
        const assets = JSON.parse(htmlContent);
        setParsedAssets(Array.isArray(assets) ? assets : [assets]);
        console.log(`✅ Found ${assets.length} assets from JSON!`);
        setParsing(false);
        return;
      }

      // Check if it's a list of URLs (one per line)
      const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const isUrlList = lines.every(line => {
        try {
          new URL(line);
          return true;
        } catch {
          return false;
        }
      });

      if (isUrlList && lines.length > 0) {
        console.log(`🔗 Detected ${lines.length} URLs, scraping each one...`);
        const scrapedAssets: ParsedAsset[] = [];

        for (let i = 0; i < lines.length; i++) {
          const url = lines[i];
          console.log(`📡 Scraping ${i + 1}/${lines.length}: ${url}`);

          try {
            const response = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (result.success && result.data) {
              scrapedAssets.push({
                title: result.data.title || 'Unknown',
                url: url,
                thumbnailUrl: result.data.thumbnailUrl || undefined,
                price: result.data.price || undefined,
                currency: result.data.currency || '$',
                platform: result.data.platform || 'ACON3D'
              });
              console.log(`✅ ${i + 1}/${lines.length} scraped successfully`);
            } else {
              console.warn(`⚠️ ${i + 1}/${lines.length} failed: ${result.error}`);
              // Still add it with minimal info
              scrapedAssets.push({
                title: url.split('/').pop() || 'Unknown',
                url: url,
                platform: 'ACON3D'
              });
            }
          } catch (err) {
            console.error(`❌ ${i + 1}/${lines.length} error:`, err);
            scrapedAssets.push({
              title: url.split('/').pop() || 'Unknown',
              url: url,
              platform: 'ACON3D'
            });
          }

          // Small delay to avoid rate limiting
          if (i < lines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        setParsedAssets(scrapedAssets);
        console.log(`✅ Scraped ${scrapedAssets.length} assets!`);
        setParsing(false);
        return;
      }

      // Otherwise, send HTML to Claude AI for parsing
      console.log('📡 Sending HTML to Claude AI for parsing...');
      const response = await fetch('/api/parse-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent })
      });

      const result = await response.json();
      console.log('📦 Received parsed data:', result);

      if (result.success && result.assets) {
        setParsedAssets(result.assets);
        console.log(`✅ Found ${result.assets.length} assets!`);
      } else {
        setError(result.error || 'Failed to parse orders');
      }
    } catch (err) {
      console.error('💥 Parse error:', err);
      setError('Failed to parse data. Make sure you pasted valid URLs, JSON, or HTML.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedAssets.length === 0 || !db) return;

    setImporting(true);
    try {
      const now = Timestamp.now();
      let imported = 0;

      for (const asset of parsedAssets) {
        await addDoc(collection(db, 'assets'), {
          userId,
          url: asset.url,
          title: asset.title,
          description: '',
          thumbnailUrl: asset.thumbnailUrl || null,
          currentPrice: asset.price || null,
          currency: asset.currency || '$',
          platform: asset.platform || 'ACON3D',
          fileLocation: null,
          projectId: null,
          collectionId: null,
          status: 'bought' as const,
          tags: [],
          priceHistory: asset.price ? [{
            price: asset.price,
            currency: asset.currency || '$',
            checkedAt: now.toDate()
          }] : [],
          lowestPrice: asset.price || null,
          lastPriceCheck: asset.price ? now : null,
          createdAt: now,
          updatedAt: now,
        });
        imported++;
        console.log(`✅ Imported ${imported}/${parsedAssets.length}: ${asset.title}`);
      }

      alert(`Successfully imported ${imported} assets!`);
      onClose();
    } catch (err) {
      console.error('💥 Import error:', err);
      alert('Failed to import some assets. Check console for details.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Import ACON3D Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Paste your ACON3D order history HTML to bulk import your purchased assets
          </p>
        </div>

        <div className="p-6">
          {parsedAssets.length === 0 ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Easiest Method: Paste Asset URLs
                </label>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900 mb-2 font-semibold">✨ Super Simple - Just paste URLs!</p>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-2">
                    <li>Go to your ACON3D order history or wishlist</li>
                    <li>Copy the URLs of the assets you want to import (one per line)</li>
                    <li>Paste them in the box below</li>
                    <li>We'll automatically scrape the info from each URL!</li>
                  </ol>
                  <p className="text-xs text-gray-600 mt-2">Example format:</p>
                  <pre className="text-xs bg-white p-2 rounded mt-1 border border-green-300">
{`https://acon3d.com/en/3dmodels/...
https://acon3d.com/en/3dmodels/...
https://acon3d.com/en/3dmodels/...`}
                  </pre>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste URLs, JSON, or HTML here:
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Paste URLs (one per line), JSON, or HTML..."
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 font-mono text-xs"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={parsing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParse}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
                  disabled={parsing || !htmlContent.trim()}
                >
                  {parsing ? '🔄 Scraping...' : '✨ Auto-Import'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Found {parsedAssets.length} assets to import:
                </h3>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {parsedAssets.map((asset, index) => (
                    <div key={index} className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <div className="flex gap-3">
                        {asset.thumbnailUrl && (
                          <img src={asset.thumbnailUrl} alt={asset.title} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{asset.title}</h4>
                          <p className="text-sm text-gray-600">{asset.url}</p>
                          {asset.price && (
                            <p className="text-sm font-semibold text-purple-600">
                              {asset.currency}{asset.price}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setParsedAssets([]);
                    setHtmlContent('');
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={importing}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
                  disabled={importing}
                >
                  {importing ? `Importing ${parsedAssets.length} assets...` : `Import ${parsedAssets.length} Assets`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
