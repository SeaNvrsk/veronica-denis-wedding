"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-indigo max-w-none focus:outline-none min-h-[180px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    // Keep editor in sync when parent resets value
    const current = editor.getHTML();
    if (value !== current) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm border transition ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-2xl border border-indigo-200 overflow-hidden bg-white">
      <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 border-b border-indigo-100">
        <Btn
          title="Жирный"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </Btn>
        <Btn
          title="Курсив"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </Btn>
        <Btn
          title="Маркированный список"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Btn>
        <Btn
          title="Заголовок"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Btn>
        <Btn
          title="Цитата"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “”
        </Btn>
        <Btn
          title="Ссылка"
          active={editor.isActive("link")}
          onClick={() => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Ссылка (URL):", prev || "https://");
            if (!url) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          🔗
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

