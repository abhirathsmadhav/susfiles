import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Prepare FormData for catbox.moe
    const catboxForm = new FormData();
    catboxForm.append('reqtype', 'fileupload');
    catboxForm.append('fileToUpload', file);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxForm,
    });

    if (!res.ok) {
      throw new Error(`Catbox API error: ${res.statusText}`);
    }

    // Catbox returns the direct URL as plain text
    const fileUrl = await res.text();

    return NextResponse.json({ url: fileUrl.trim() });
  } catch (error: any) {
    console.error('Catbox upload failed:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
