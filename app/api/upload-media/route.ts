import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  // --- Authentication Check ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Restrict guests from uploading
    if (decodedToken.firebase.sign_in_provider === 'anonymous') {
      return NextResponse.json({ error: 'Forbidden: Guests cannot upload files.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }
  // --------------------------

  try {
    const formData = await req.formData();
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
