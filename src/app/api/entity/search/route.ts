import { NextRequest, NextResponse } from 'next/server'
import { searchRepositories } from '@/lib/api/github'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const repos = await searchRepositories(query)
    
    const results = repos.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      language: repo.language,
      topics: repo.topics,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}