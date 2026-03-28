"use client"
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ToolBar } from "./Toolbar";
import Heading from "@tiptap/extension-heading"
import { useEffect } from "react";

export default function TipTap({
    description,
    onChange,
}:{
    description: string 
    onChange: (richText: string) => void
}) {

    const CustomHeading = Heading.extend({
        name: "heading",
        renderHTML({ node, HTMLAttributes }) {
            const level = node.attrs.level;
            const classes: Record<number, string> = {
            1: "text-3xl font-bold",
            2: "text-2xl font-semibold",
            3: "text-xl font-semibold",
            };

            return ["h" + level, { ...HTMLAttributes, class: classes[level] || "" }, 0];
        },
    })

    const editor = useEditor({
        extensions: [StarterKit.configure({
            heading:false
            }),
            CustomHeading, 
        ],
        content: description,
        editorProps: {
            attributes: {
                class: "rounded-md min-h-[150px] bg-background w-full max-h-[500px] overflow-y-auto \
                    [&_ul]:list-disc [&_ul]:ml-6 \
                    [&_ol]:list-decimal [&_ol]:ml-6 \
                    [&_li]:my-1 \
                    [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2"
            }, 
        },
        onUpdate({editor}){
            onChange(editor.getHTML())
            console.log(editor.getHTML())
        },
    });
    useEffect(() => {
    if (editor && description !== editor.getHTML()) 
        {
            editor.commands.setContent(description); 
        }
    }, [description, editor]);

    return (
        <div className="flex flex-col justify-stretch min-h-[250px] border-1 p-2 border-foreground rounded-lg">
            <ToolBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    )
}