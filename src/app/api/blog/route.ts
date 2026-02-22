import { NextResponse } from "next/server";
import { getBlogPosts, addBlogPost } from "@/lib/store";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === ADMIN_SECRET;
}

export async function GET() {
  try {
    const posts = await getBlogPosts();
    const published = posts.filter((p) => p.published);
    return NextResponse.json(published);
  } catch {
    return NextResponse.json(
      { error: "Failed to load blog" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, images, videoUrl, published } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Заголовок и содержание обязательны" },
        { status: 400 }
      );
    }

    const post = await addBlogPost({
      title: title.trim(),
      content: content.trim(),
      images: Array.isArray(images) ? images : [],
      videoUrl: videoUrl || undefined,
      published: published ?? true,
    });

    return NextResponse.json(post);
  } catch {
    return NextResponse.json(
      { error: "Не удалось создать запись" },
      { status: 500 }
    );
  }
}
