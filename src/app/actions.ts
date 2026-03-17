"use server";

import { getSupabaseServerClient } from "@/utils/supabase";

export async function createGuestbookEntryAction(input: {
  author: string;
  message: string;
  emoji?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  const supabase = getSupabaseServerClient();

  const author = input.author?.trim();
  const message = input.message?.trim();

  if (!author || !message) {
    return { ok: false as const, error: "Имя и сообщение обязательны" };
  }
  if (author.length > 50) {
    return { ok: false as const, error: "Имя слишком длинное" };
  }
  if (message.length > 1000) {
    return { ok: false as const, error: "Сообщение слишком длинное" };
  }

  const { data, error } = await supabase
    .from("guestbook")
    .insert({
      author,
      message,
      emoji: input.emoji || null,
      image_url: input.imageUrl || null,
      video_url: input.videoUrl || null,
    })
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: "Не удалось добавить сообщение" };
  }

  return {
    ok: true as const,
    entry: {
      id: data.id,
      author: data.author,
      message: data.message,
      emoji: data.emoji ?? undefined,
      image: data.image_url ?? undefined,
      video: data.video_url ?? undefined,
      createdAt: data.created_at,
    },
  };
}

export async function uploadGuestbookMediaAction(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Файл не выбран" };
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return {
      ok: false as const,
      error: "Разрешены только фото и видео",
    };
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      ok: false as const,
      error: isVideo ? "Видео не больше 50 МБ" : "Фото не больше 10 МБ",
    };
  }

  const extFromName = file.name.includes(".")
    ? file.name.split(".").pop() || ""
    : "";
  const ext =
    extFromName ||
    (isVideo ? "mp4" : "jpg");

  const path = `guestbook/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("wedding-photos")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false as const, error: "Не удалось загрузить файл" };
  }

  const { data } = supabase.storage.from("wedding-photos").getPublicUrl(path);
  return {
    ok: true as const,
    url: data.publicUrl,
    type: isVideo ? ("video" as const) : ("image" as const),
  };
}

export async function submitQuizResultAction(input: {
  answers: { questionId: number; answer: number; correct: boolean }[];
  score: number;
  total: number;
}) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      score: input.score,
      total: input.total,
      answers: input.answers,
    })
    .select("*")
    .single();

  if (error) {
    return { ok: false as const, error: "Не удалось сохранить ответы" };
  }

  return { ok: true as const, result: data };
}

