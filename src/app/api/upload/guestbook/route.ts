import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Файл не выбран" },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Разрешены только фото (JPEG, PNG, GIF, WebP) и видео (MP4, WebM)" },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isVideo
            ? "Видео не больше 50 МБ"
            : "Фото не больше 10 МБ",
        },
        { status: 400 }
      );
    }

    if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Формат изображения не поддерживается" },
        { status: 400 }
      );
    }
    if (isVideo && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Формат видео не поддерживается (используйте MP4 или WebM)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "guestbook");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || (isVideo ? ".mp4" : ".jpg");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      url: `/uploads/guestbook/${filename}`,
      type: isVideo ? "video" : "image",
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить файл" },
      { status: 500 }
    );
  }
}
