import { promises as fs } from "fs";
import path from "path";
import { QUIZ_QUESTIONS as DEFAULT_QUIZ_QUESTIONS } from "./quiz-data";

const DATA_DIR = path.join(process.cwd(), "data");
const GUESTBOOK_FILE = path.join(DATA_DIR, "guestbook.json");
const QUIZ_FILE = path.join(DATA_DIR, "quiz.json");
const QUIZ_QUESTIONS_FILE = path.join(DATA_DIR, "quiz-questions.json");
const BLOG_FILE = path.join(DATA_DIR, "blog.json");

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  emoji?: string;
  image?: string;
  video?: string;
  createdAt: string;
}

export interface QuizAnswer {
  questionId: number;
  answer: number;
  correct: boolean;
}

export interface QuizSubmission {
  id: string;
  answers: QuizAnswer[];
  score: number;
  total: number;
  submittedAt: string;
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

export async function getGuestbookEntries(): Promise<GuestbookEntry[]> {
  return readJson<GuestbookEntry[]>(GUESTBOOK_FILE, []);
}

export async function addGuestbookEntry(
  entry: Omit<GuestbookEntry, "id" | "createdAt">
): Promise<GuestbookEntry> {
  const entries = await getGuestbookEntries();
  const newEntry: GuestbookEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  entries.push(newEntry);
  await writeJson(GUESTBOOK_FILE, entries);
  return newEntry;
}

export async function getQuizQuestions(): Promise<QuizQuestion[]> {
  const stored = await readJson<QuizQuestion[]>(QUIZ_QUESTIONS_FILE, []);
  if (stored.length > 0) return stored;
  return DEFAULT_QUIZ_QUESTIONS;
}

export async function setQuizQuestions(questions: QuizQuestion[]): Promise<void> {
  await writeJson(QUIZ_QUESTIONS_FILE, questions);
}

export async function getQuizSubmissions(): Promise<QuizSubmission[]> {
  return readJson<QuizSubmission[]>(QUIZ_FILE, []);
}

export async function addQuizSubmission(
  submission: Omit<QuizSubmission, "id" | "submittedAt">
): Promise<QuizSubmission> {
  const submissions = await getQuizSubmissions();
  const newSubmission: QuizSubmission = {
    ...submission,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  };
  submissions.push(newSubmission);
  await writeJson(QUIZ_FILE, submissions);
  return newSubmission;
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
