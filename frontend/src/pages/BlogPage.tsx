import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { blogPosts } from '~/lib/blogData'
import Nav from '~/components/landing/Nav'
import Footer from '~/components/landing/Footer'

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-light text-dark-text pattern-naira">
      <Nav />

      <div className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-accent text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-2">Blog</motion.p>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-3">Insights and updates</motion.h1>
            <motion.p variants={fadeUp} className="text-gray-500 text-sm sm:text-base mb-10 sm:mb-14">Stories, guides, and news from the tipfy team.</motion.p>
          </motion.div>

          <Link to={`/blog/${blogPosts[0].slug}`} className="block group mb-10 sm:mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="grid lg:grid-cols-2 gap-6 items-center">
              <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-gray-100">
                <img src={blogPosts[0].image} alt={blogPosts[0].title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">{blogPosts[0].category}</span>
                  <span className="text-[10px] text-gray-400">{blogPosts[0].readTime}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-accent transition-colors">{blogPosts[0].title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{blogPosts[0].excerpt}</p>
                <div className="flex items-center gap-2.5">
                  <img src={blogPosts[0].author.avatar} alt={blogPosts[0].author.name} className="h-7 w-7 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="text-xs font-medium">{blogPosts[0].author.name}</p>
                    <p className="text-[10px] text-gray-400">{blogPosts[0].date}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogPosts.slice(1).map((post, i) => (
              <motion.div key={post.slug} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to={`/blog/${post.slug}`} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow block">
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">{post.category}</span>
                      <span className="text-[10px] text-gray-400">{post.readTime}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-1.5 group-hover:text-accent transition-colors leading-snug">{post.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
                    <p className="text-[10px] text-gray-400">{post.date}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
