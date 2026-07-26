import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log("File received:", file.name, file.size, file.type);

    // Prepare FormData for catbox.moe
    const catboxForm = new FormData();
    catboxForm.append('reqtype', 'fileupload');
    catboxForm.append('fileToUpload', file, file.name || 'upload.mp4');

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxForm,
    });

    if (!res.ok) {
      throw new Error(`Catbox API error: ${res.status} ${res.statusText}`);
    }

    // Catbox returns the direct URL as plain text
    const fileUrl = await res.text();

    return NextResponse.json({ url: fileUrl.trim() });
  } catch (error: any) {
    console.error('Catbox upload failed:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
