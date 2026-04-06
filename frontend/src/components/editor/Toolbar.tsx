"use client"

import {type Editor} from "@tiptap/react" 
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Strikethrough,
    Code,
    Quote,
    Minus,
    Heading1,
    Heading3,
} from "lucide-react"
import {Toggle} from "../ui/toggle"

type Props = {
    editor: Editor | null
}

export function ToolBar({editor}: Props){
    if(!editor){
        return null
    }

    // Use the dynamic theme color for RTE toolbar.
    const toggleClassName = `
        text-foreground
        hover:bg-secondary hover:text-background
        data-[state=on]:bg-secondary/15
        data-[state=on]:text-secondary
        data-[state=on]:border-secondary
    `
    
    return (
        <div className="border-b border-border bg-transparent rounded-none">
            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("heading", {level:1})}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({level:1}).run()
                }
            >
                <Heading1 className="h-4 w-4"/>
            </Toggle>
            <Toggle 
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("heading", {level:2})}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({level:2}).run()
                }
            >
                <Heading2 className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("heading", {level:3})}
                onPressedChange={() =>
                    editor.chain().focus().toggleHeading({level:3}).run()
                }
            >
                <Heading3 className="h-4 w-4"/>
            </Toggle>

            <Toggle 
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Toggle>

            <Toggle 
                size ="sm"
                className={toggleClassName}
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Toggle>

            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("bulletList")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            >
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle 
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("orderedList")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>
           <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("strike")}
                onPressedChange={() =>
                    editor.chain().focus().toggleStrike().run()
                }
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("code")}
                onPressedChange={() =>
                    editor.chain().focus().toggleCode().run()
                }
            >
                <Code className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("codeBlock")}
                onPressedChange={() =>
                    editor.chain().focus().toggleCodeBlock().run()
                }
            >
                <Code className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={editor.isActive("blockquote")}
                onPressedChange={() =>
                    editor.chain().focus().toggleBlockquote().run()
                }
            >
                <Quote className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className={toggleClassName}
                pressed={false}
                onPressedChange={() =>
                    editor.chain().focus().setHorizontalRule().run()
                }
            >
                <Minus className="h-4 w-4" />
            </Toggle>
        </div>
    )
}
