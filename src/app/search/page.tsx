import SearchPageClient from '@/components/SearchPageClient';

interface SearchPageProps {
  searchParams: Promise<{ query?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.query || '';
  const category = params.category || '';

  return <SearchPageClient initialQuery={query} initialCategory={category} />;
}
