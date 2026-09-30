import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase-server';
import SharePageClient from './SharePageClient';
import type { MemoryRecord } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Memory · ${id} — Memory Booth`,
    description: 'A retro photobooth memory.',
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;

  if (!id || id.length > 20) notFound();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('photobooths')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  return <SharePageClient memory={data as MemoryRecord} />;
}
