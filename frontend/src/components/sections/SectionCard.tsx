import { 
    ChevronDownIcon, 
    PencilLine, 
    Trash2 
} from "lucide-react";
import { 
    Button 
} from "../ui/button";
import { 
    Card, 
    CardAction, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "../ui/card";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "../ui/dialog";
import { HoverCard, 
    HoverCardContent, 
    HoverCardTrigger 
} from "../ui/hover-card";
import { 
    Collapsible, 
    CollapsibleContent, 
    CollapsibleTrigger 
} from "../ui/collapsible";
import { 
    Separator 
} from "../ui/separator";
import { 
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage, 
} from "../ui/avatar";
import { useEffect, useMemo, useRef } from "react";

import type { Section } from "@/api/sectionsApi";
import { AVATAR_MAP } from "@/constants/avatars";
import { Link } from "react-router-dom";

type SectionCardProps = {
  section: Section;
  onEdit: (section: Section) => void;
  onDelete?: (section: Section) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery?: string;
  isActiveSearchResult?: boolean;
  activeField?: "title" | "description" | "body" | null;
  activeOccurrenceIndex?: number | null;
};

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return text;

    const safeQuery = escapeRegExp(trimmedQuery);
    const regex = new RegExp(`(${safeQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <mark
                key={index}
                data-search-match="true"
                className="rounded px-1 bg-yellow-200 text-black"
            >
                {part}
            </mark>
        ) : (
            <span key={index}>{part}</span>
        )
    );
}

function highlightHtmlContent(html: string, query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const safeQuery = escapeRegExp(trimmedQuery);
    const regex = new RegExp(safeQuery, "gi");

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;

            const parentElement = node.parentElement;
            if (!parentElement) return NodeFilter.FILTER_REJECT;

            if (["SCRIPT", "STYLE"].includes(parentElement.tagName)) {
                return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });

    const textNodes: Text[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
        textNodes.push(currentNode as Text);
        currentNode = walker.nextNode();
    }

    textNodes.forEach((textNode) => {
        const originalText = textNode.textContent || "";

        if (!regex.test(originalText)) {
            regex.lastIndex = 0;
            return;
        }

        regex.lastIndex = 0;

        const wrapper = doc.createElement("span");
        wrapper.innerHTML = originalText.replace(
            regex,
            (match) =>
                `<mark data-search-match="true" class="rounded px-1 bg-yellow-200 text-black">${match}</mark>`
        );

        const fragment = doc.createDocumentFragment();
        while (wrapper.firstChild) {
            fragment.appendChild(wrapper.firstChild);
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
    });

    return doc.body.innerHTML;
}

function clearActiveMatch() {
    const previousActive = document.querySelectorAll("[data-search-active='true']");
    previousActive.forEach((node) => {
        node.removeAttribute("data-search-active");
        node.classList.remove("ring-2", "ring-orange-400", "bg-orange-300");
        node.classList.add("bg-yellow-200", "text-black");
    });
}

function scrollToMatchWithOffset(element: HTMLElement, offset = 104) {
    const rect = element.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const targetTop = Math.max(0, absoluteTop - offset);

    window.scrollTo({
        top: targetTop,
        behavior: "auto",
    });
}

export default function SectionCard({ section, onEdit, onDelete, open, onOpenChange, searchQuery = "", isActiveSearchResult = false, activeField = null, activeOccurrenceIndex = null,}: SectionCardProps) {

    // Contributor constants
    // Stores only unique users
    const uniqueContributors = Array.from(
        new Map(
            section.contributors.map((contributor) => [contributor.userId, contributor])
        ).values()
    )
    // Constant controls how many profile pics are displayed on contributors
    const MAX_VISIBLE_CONTRIBUTORS = 5;
    const visibleContributors = uniqueContributors.slice(0,MAX_VISIBLE_CONTRIBUTORS);
    // Calculates how many contributors remain after the MAX_VISIBLE_CONTRIBUTORS are displayed
    const remainingContributors = uniqueContributors.length - MAX_VISIBLE_CONTRIBUTORS; 

    const bodyRef = useRef<HTMLDivElement | null>(null);
    const titleRef = useRef<HTMLHeadingElement | null>(null);
    const descriptionRef = useRef<HTMLParagraphElement | null>(null);

    const highlightedTitle = useMemo(() => {
        return highlightText(section.title ?? "", searchQuery);
    }, [section.title, searchQuery]);

    const highlightedDescription = useMemo(() => {
        return highlightText(section.description ?? "", searchQuery);
    }, [section.description, searchQuery]);

    const highlightedBodyHtml = useMemo(() => {
        return highlightHtmlContent(section.body ?? "", searchQuery);
    }, [section.body, searchQuery]);

        useEffect(() => {
            if (!open) return;
            if (!searchQuery.trim() || !isActiveSearchResult || activeOccurrenceIndex === null) {
                return;
            }

            requestAnimationFrame(() => {
                let target: HTMLElement | null = null;

                if (activeField === "title" && titleRef.current) {
                    const marks = titleRef.current.querySelectorAll("mark[data-search-match='true']");
                    target = (marks[activeOccurrenceIndex] as HTMLElement) ?? null;
                }

                if (activeField === "description" && descriptionRef.current) {
                    const marks = descriptionRef.current.querySelectorAll("mark[data-search-match='true']");
                    target = (marks[activeOccurrenceIndex] as HTMLElement) ?? null;
                }

                if (activeField === "body" && bodyRef.current) {
                    const marks = bodyRef.current.querySelectorAll("mark[data-search-match='true']");
                    target = (marks[activeOccurrenceIndex] as HTMLElement) ?? null;
                }

                clearActiveMatch();

                if (target) {
                    target.setAttribute("data-search-active", "true");
                    target.classList.remove("bg-yellow-200");
                    target.classList.add("bg-orange-300", "ring-2", "ring-orange-400", "text-black");

                    scrollToMatchWithOffset(target, 104);
                }
            });
        }, [searchQuery, isActiveSearchResult, activeField, activeOccurrenceIndex, open, highlightedBodyHtml]);

        useEffect(() => {
            if (searchQuery.trim()) return;
            clearActiveMatch();
        }, [searchQuery]);

    return(

        <Card
            className={`bg-primary m-0 border-none w-full ${
                isActiveSearchResult ? "ring-2 ring-secondary" : ""
            }`}
        >

            <CardHeader>

                <CardTitle
                    ref={titleRef}
                    className="text-left font-funnel font-bold text-xl text-secondary sm:text-2xl"
                >
                    {highlightedTitle}
                </CardTitle>

                <CardDescription
                    ref={descriptionRef}
                    className="text-left font-instrument font-thin text-xs text-foreground italic sm:text-sm"
                >
                    {highlightedDescription}
                </CardDescription>
            
                <CardAction >
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <Button
                                className=" hover:text-secondary hover:cursor-pointer"
                                aria-label="Edit section"
                                onClick={() => onEdit(section)}
                            >
                                <PencilLine />
                            </Button>
                        </HoverCardTrigger>

                        <HoverCardContent side="top" className="bg-background">
                            <div className="font-instrument text-xs text-center text-foreground ">
                                Edit the section title, description, and body to better reflect the content and discussions within this section.
                            </div>
                        </HoverCardContent>

                    </HoverCard>

                    {/* Delete button */}
                    {onDelete && (
                        <HoverCard>
                        <Dialog>
                            <DialogTrigger asChild>
                            <HoverCardTrigger asChild>
                                <Button
                                className="hover:text-destructive hover:cursor-pointer hover:underline"
                                aria-label="Delete section"
                                >
                                <Trash2 />
                                </Button>
                            </HoverCardTrigger>
                            </DialogTrigger>

                            <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Section</DialogTitle>
                                <DialogDescription className="capitalize">
                                Are you sure? This action will permanently delete the section!
                                </DialogDescription>
                            </DialogHeader>

                            <Button
                                className="bg-secondary text-primary hover:cursor-pointer hover:text-primary hover:bg-destructive"
                                onClick={() => onDelete(section)}
                            >
                                Yes, delete this section
                            </Button>

                            </DialogContent>
                        </Dialog>

                        <HoverCardContent side="top" className="bg-background">
                            <div className="font-instrument text-xs text-center text-foreground">
                            Delete this section and all its content. This action cannot be undone.
                            </div>
                        </HoverCardContent>
                        </HoverCard>
                    )}
                </CardAction>
            </CardHeader>

            <CardContent className="text-foreground wrap-break-words overflow-y-auto">
                <Collapsible open={open} onOpenChange={onOpenChange} className="data-[state=open]:bg-primary rounded-md">
                
                    <CollapsibleTrigger asChild className="mb-2">
                        <Button 
                        variant="ghost" 
                        className="group w-full bg-primary hover:bg-secondary hover:cursor-pointer" 
                        aria-label="Expand Section"
                        >
                            View Section
                            <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>

                    <Separator orientation="horizontal" className="bg-secondary mb-2"/>
                    
                    <CollapsibleContent 
                        className="
                            flex flex-col items-start gap-2 p-2.5 pt-0 text-xs font-instrument font-thin sm:text-sm
                            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4
                            [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3
                            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2
                            [&_ul]:list-disc [&_ul]:ml-6
                            [&_ol]:list-decimal [&_ol]:ml-6
                            [&_li]:my-1
                            [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2
                        "
                    >
                        <div
                            ref={bodyRef}
                            dangerouslySetInnerHTML={{__html: highlightedBodyHtml}}
                        />
                        <div className="mt-3 flex flex-row items-center gap-3 font-bold text-base text-secondary">
                            <p>Contributors:</p>
                            <AvatarGroup>
                                {visibleContributors.map((contributor) => {
                                    return (
                                    <Link key={contributor.userId} to={`/profile/${contributor.userId}`}>  
                                        <Avatar key={`${contributor.userId}-${contributor.date}`}>
                                            <AvatarImage
                                                src={AVATAR_MAP[contributor.profilePic ?? ""] ?? "https://github.com/shadcn.png"}
                                                alt={contributor.username || "user"}
                                            />
                                            <AvatarFallback>
                                                {contributor.username
                                                    ? contributor.username.slice(0,2).toUpperCase()
                                                    : "??"
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>  
                                )})}

                                {remainingContributors > 0 && (
                                    <AvatarGroupCount>+{remainingContributors}</AvatarGroupCount>
                                )}
                            </AvatarGroup>

                        </div>
                    </CollapsibleContent>
                </Collapsible>     
            </CardContent>
        </Card>
    );
}