'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Code } from 'lucide-react'
import { useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'min-h-[10rem] px-3 py-2.5 text-sm outline-none' },
    },
  })

  useEffect(() => {
    if (!editor) return;
    if (value === '') {
      editor.commands.clearContent();
      return;
    }
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value])

  if (!editor) return null

  const toolbarButtons = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
      title: 'Negrito',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
      title: 'Itálico',
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive('underline'),
      title: 'Sublinhado',
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
      title: 'Lista',
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
      title: 'Lista numerada',
    },
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive('code'),
      title: 'Código',
    },
  ]

  return (
    <div className="border border-input rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/50">
        {toolbarButtons.map(({ icon: Icon, action, active, title }) => (
          <button
            key={title}
            type="button"
            onClick={action}
            title={title}
            className={`p-1.5 rounded transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
