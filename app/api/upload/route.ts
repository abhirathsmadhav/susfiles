import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    return NextResponse.json(
      { error: 'Server misconfigured — missing Cloudinary credentials.' },
      { status: 500 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'sus-files';

  // Cloudinary signature: SHA-1 of alphabetically sorted params + API secret
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
