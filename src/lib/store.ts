import { promises as fs } from "fs";
import path from "path";
import { QUIZ_QUESTIONS as DEFAULT_QUIZ_QUESTIONS } from "./quiz-data";

const DATA_DIR = path.join(process.cwd(), "data");
const QUIZ_QUESTIONS_FILE = path.join(DATA_DIR, "quiz-questions.json");
const BLOG_FILE = path.join(DATA_DIR, "blog.json");

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizAnswer {
  questionId: number;
  answer: number;
  correct: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  createdAt: string;
  published: boolean;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // dir exists
  }
}

async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const stored = await readJson<QuizQuestion[]>(QUIZ_QUESTIONS_FILE, []);
  if (stored.length > 0) return stored;
  return DEFAULT_QUIZ_QUESTIONS;
}

export async function setQuizQuestions(questions: QuizQuestion[]): Promise<void> {
  await writeJson(QUIZ_QUESTIONS_FILE, questions);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return readJson<BlogPost[]>(BLOG_FILE, []);
}

export async function addBlogPost(
  post: Omit<BlogPost, "id" | "createdAt">
): Promise<BlogPost> {
  const posts = await getBlogPosts();
  const newPost: BlogPost = {
    ...post,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  posts.unshift(newPost);
  await writeJson(BLOG_FILE, posts);
  return newPost;
}

export async function updateBlogPost(
  id: string,
  updates: Partial<BlogPost>
): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  posts[index] = { ...posts[index], ...updates };
  await writeJson(BLOG_FILE, posts);
  return posts[index];
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const posts = await getBlogPosts();
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === posts.length) return false;
  await writeJson(BLOG_FILE, filtered);
  return true;
}
