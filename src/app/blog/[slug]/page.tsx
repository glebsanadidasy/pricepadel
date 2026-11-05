import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StubPage } from "@/components/layout/StubPage";
import { BLOG_POSTS } from "@/data/blog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  return post ? { title: post.title } : {};
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();
  return <StubPage title={post.title} crumbs={[{ href: "/blog", label: "Blog" }, { href: `/blog/${post.slug}`, label: post.category }]} />;
}
