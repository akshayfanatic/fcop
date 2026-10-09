import { env } from '../../../config/env.js';
import { BaseEmail } from '../components/base-email.js';
import { emailStyles } from '../styles.js';
import type { EmailTemplate } from '../types.js';

type BlogAnnouncement = { title: string; slug: string; excerpt: string | null };

export const createNewBlogPostEmailTemplate = (blog: BlogAnnouncement): EmailTemplate => {
  const postUrl = new URL(`/blog/${blog.slug}`, env.frontendUrl).toString();

  return {
    subject: `New on the blog: ${blog.title}`,
    react: (
      <BaseEmail previewText={blog.excerpt || blog.title} category="BLOG">
        <h1 style={emailStyles.heading}>{blog.title}</h1>
        {blog.excerpt && <p style={emailStyles.text}>{blog.excerpt}</p>}
        <a href={postUrl} style={emailStyles.button}>
          Read the post
        </a>
      </BaseEmail>
    ),
    text: [blog.title, blog.excerpt, `Read the post: ${postUrl}`].filter(Boolean).join('\n\n')
  };
};
