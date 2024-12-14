import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'posts');

export function getSortedPostsData() {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData: any[] = fileNames.map((fileName) => {
    // Remove ".md" from file name to get the slug
    const slug = fileName.replace(/\.md$/, '');

    // Read Markdown file as a string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Parse the file's front matter
    const {data} = matter(fileContents);

    return {
      slug,
      ...(data), // Add front matter fields (e.g., title, date)
    };
  });

  // Sort posts by date
  return allPostsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostData(slug: string) {
  const fs = (await import('fs')).default;
  const path = (await import('path')).default;

  const postsDirectory = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const {data, content} = matter(fileContents);

  return {
    slug,
    content,
    images: data.images || [], // Add this line to include images from the front matter
    ...data,
  } as any;
}
