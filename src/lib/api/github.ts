const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  language: string | null
  topics: string[]
  html_url: string
}

export async function searchRepositories(query: string, limit = 10): Promise<GitHubRepo[]> {
  if (!GITHUB_TOKEN) {
    console.warn('GITHUB_TOKEN not set - using mock data')
    return getMockResults(query)
  }

  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      console.error('GitHub API error:', response.status)
      return getMockResults(query)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('GitHub API error:', error)
    return getMockResults(query)
  }
}

export async function getRepository(fullName: string): Promise<GitHubRepo | null> {
  if (!GITHUB_TOKEN) {
    return getMockRepo(fullName)
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getRepositoryMetrics(fullName: string) {
  const repo = await getRepository(fullName)
  if (!repo) return null

  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    language: repo.language,
    topics: repo.topics,
    description: repo.description,
  }
}

function getMockResults(query: string): GitHubRepo[] {
  const mockRepos: GitHubRepo[] = [
    { name: 'react', full_name: 'facebook/react', description: 'React is a JavaScript library for building user interfaces.', stargazers_count: 225000, forks_count: 47000, watchers_count: 8500, language: 'JavaScript', topics: ['ui', 'react', 'javascript', 'frontend'], html_url: 'https://github.com/facebook/react' },
    { name: 'vue', full_name: 'vuejs/vue', description: 'Vue.js is a progressive framework for building user interfaces.', stargazers_count: 206000, forks_count: 34000, watchers_count: 6200, language: 'TypeScript', topics: ['vue', 'framework', 'typescript', 'frontend'], html_url: 'https://github.com/vuejs/vue' },
    { name: 'tensorflow', full_name: 'tensorflow/tensorflow', description: 'TensorFlow is an open source machine learning framework.', stargazers_count: 178000, forks_count: 89000, watchers_count: 5500, language: 'Python', topics: ['machine-learning', 'tensorflow', 'deep-learning', 'python'], html_url: 'https://github.com/tensorflow/tensorflow' },
    { name: 'pytorch', full_name: 'pytorch/pytorch', description: 'Tensors and Dynamic neural networks in Python.', stargazers_count: 76000, forks_count: 20000, watchers_count: 3200, language: 'Python', topics: ['machine-learning', 'pytorch', 'deep-learning', 'python'], html_url: 'https://github.com/pytorch/pytorch' },
    { name: 'nextjs', full_name: 'vercel/next.js', description: 'The React Framework for the Web', stargazers_count: 118000, forks_count: 26000, watchers_count: 4100, language: 'TypeScript', topics: ['nextjs', 'react', 'framework', 'typescript'], html_url: 'https://github.com/vercel/next.js' },
    { name: 'chatgpt', full_name: 'openai/chatgpt', description: 'ChatGPT optimization framework', stargazers_count: 15000, forks_count: 2200, watchers_count: 800, language: 'Python', topics: ['ai', 'chatgpt', 'llm'], html_url: 'https://github.com/openai/chatgpt-retrieval-plugin' },
    { name: 'llama', full_name: 'meta-llama/llama', description: 'LLaMA language model', stargazers_count: 8500, forks_count: 1400, watchers_count: 450, language: 'Python', topics: ['llm', 'meta', 'ai'], html_url: 'https://github.com/meta-llama/llama' },
    { name: 'rust', full_name: 'rust-lang/rust', description: 'Empowering everyone to build reliable and efficient software.', stargazers_count: 95000, forks_count: 12000, watchers_count: 3800, language: 'Rust', topics: ['rust', 'programming-language', 'systems'], html_url: 'https://github.com/rust-lang/rust' },
  ]

  const q = query.toLowerCase()
  return mockRepos.filter(r => 
    r.name.toLowerCase().includes(q) ||
    r.full_name.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q) ||
    r.topics.some(t => t.toLowerCase().includes(q))
  ).slice(0, 8)
}

function getMockRepo(fullName: string): GitHubRepo | null {
  const mockRepos = getMockResults('')
  return mockRepos.find(r => r.full_name === fullName) || null
}