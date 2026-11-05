import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog";

/** "From the blog" (Figma 3:345). Articles are not written yet, so cards show no dates, comment counts or excerpts. */
export function BlogCards() {
  return (
    <section aria-labelledby="blog-title" className="section-fade pb-[70px] pt-[70px]">
      <div className="mx-auto max-w-site px-[15px] text-center lg:px-0">
        <h2 id="blog-title" className="text-[34px] font-black uppercase leading-[1.1] text-ink md:text-[44px]">
          From the blog
        </h2>
        <p className="mx-auto mt-[20px] max-w-[620px] text-[16px] leading-[22px]">Racket guides, playing tips and padel news — everything you need to level up your game.</p>
      </div>
      <ul className="mx-auto mt-[46px] grid max-w-[1274px] gap-x-[90px] gap-y-[48px] px-[25px] sm:grid-cols-2 lg:grid-cols-4 lg:px-[5px]">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug}>
            <article>
              <Link href={`/blog/${post.slug}`} className="relative block aspect-[248/186] overflow-hidden" tabIndex={-1} aria-hidden="true">
                <Image src={post.image} alt="" fill sizes="(min-width: 1024px) 248px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                {/* The category label is part of the temporary picture (cut from the mockup); live label returns with real photos. */}
              </Link>
              <p className="sr-only">{post.category}</p>
              <h3 className="mt-[22px] text-[18px] leading-[22px] text-ink">
                <Link href={`/blog/${post.slug}`} className="hover:text-royal">
                  {post.title}
                </Link>
              </h3>
              <Link href={`/blog/${post.slug}`} className="mt-[14px] inline-block text-[16px] leading-[22px] text-sky hover:underline">
                Continue Reading
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
