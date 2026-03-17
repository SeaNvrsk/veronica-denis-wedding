import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/utils/supabase";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "wedding2026";

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader?.replace("Bearer ", "") === ADMIN_SECRET;
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "blog");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Разрешены только фото и видео" },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? 200 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isVideo ? "Видео не больше 200 МБ" : "Фото не больше 15 МБ" },
        { status: 400 }
      );
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() || "" : "";
    const path = `${kind}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext || (isVideo ? "mp4" : "jpg")}`;

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.storage
      .from("wedding-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      return NextResponse.json(
        { error: "Upload failed", details: error.message },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("wedding-photos").getPublicUrl(path);
    return NextResponse.json({
      url: data.publicUrl,
      type: isVideo ? "video" : "image",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Upload failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

