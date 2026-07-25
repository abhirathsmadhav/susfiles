import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_URL = 'https://api.imgbb.com/1/upload';

export async function POST(req: NextRequest) {
  if (!IMGBB_API_KEY) {
    return NextResponse.json(
      { error: 'IMGBB_API_KEY is not configured on the server' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Build multipart request to ImgBB
    const imgbbForm = new FormData();
    imgbbForm.append('image', file);

    const res = await fetch(`${IMGBB_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: imgbbForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('ImgBB error:', errText);
      return NextResponse.json({ error: 'ImgBB upload failed' }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      url: data.data.url as string,
      displayUrl: data.data.display_url as string,
      deleteUrl: data.data.delete_url as string,
    });
  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
