import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { createServerClient } from '@/lib/supabase-server';
import type { FilterName } from '@/types';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const filter = (formData.get('filter') as FilterName) || 'original';
    const musicUrl = (formData.get('musicUrl') as string) || null;
    const musicProvider = (formData.get('musicProvider') as string) || null;
    const message = (formData.get('message') as string) || null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    }

    const supabase = createServerClient();
    const id = nanoid();
    const fileName = `strips/${id}.jpg`;

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('photobooth-strips')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photobooth-strips')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('photobooths')
      .insert({
        id,
        image_url: publicUrl,
        filter,
        music_url: musicUrl,
        music_provider: musicProvider,
        message: message?.trim() || null,
      });

    if (dbError) {
      console.error('DB insert error:', dbError);
      // Clean up the uploaded file
      await supabase.storage.from('photobooth-strips').remove([fileName]);
      return NextResponse.json({ error: 'Failed to save memory.' }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (err) {
    console.error('Create error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
