import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getPostBySlug, blogPosts } from '~/lib/blogData'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = getPostBySlug(slug || '')

  if (!post) {
    return (
      <div className="min-h-screen bg-light text-dark-text pattern-grid">
        <Nav />
        <div className="pt-32 pb-24 text-center">
          <h1 className="text-2xl font-bold mb-3">Post not found</h1>
          <Link to="/blog" className="text-accent text-sm hover:underline">Back to blog</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light text-dark-text pattern-grid">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-dark-text transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">{post.category}</span>
            <span className="text-[10px] text-gray-400">{post.readTime}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-5">{post.title}</h1>

          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
            <img src={post.author.avatar} alt={post.author.name} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
            <div>
              <p className="text-sm font-medium">{post.author.name}</p>
              <p className="text-xs text-gray-400">{post.author.role} · {post.date}</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden aspect-[2/1] bg-gray-100 mb-8">
            <img src={post.image} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
          </div>

          <article className="prose prose-gray max-w-none">
            {post.content.map((paragraph, i) => (
              <p key={i} className="text-sm sm:text-[15px] text-gray-600 leading-[1.8] mb-5">
                {paragraph}
              </p>
            ))}
          </article>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">More from the blog</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2).map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">{p.category}</span>
                  <h3 className="font-bold text-sm mt-1 group-hover:text-accent transition-colors leading-snug">{p.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-2">{p.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
