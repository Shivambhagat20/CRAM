import React, { 
    Fragment,
    useEffect, 
    useMemo, 
    useRef 
} from "react";
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
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage, 
} from "../ui/avatar";

import type { Definition, Section } from "@/api/sectionsApi";
import { AVATAR_MAP } from "@/constants/avatars";
import { Link } from "react-router-dom";

type SectionCardProps = {
  section: Section;
  definitions: Definition[];
  onEdit: (section: Section) => void;
  onDelete?: (section: Section) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery?: string;
  isActiveSearchResult?: boolean;
  activeField?: "title" | "description" | "body" | null;
  activeOccurrenceIndex?: number | null;
};

type TextPiece = {
    text: string;
    isSearchMatch: boolean;
};

type TextSegment =
  | {
      kind: "text";
      pieces: TextPiece[];
    }
  | {
      kind: "definition";
      pieces: TextPiece[];
      definition: Definition;
    };

// Escape special regex characters.
function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Highlights matches in simple text (sections titles and descriptions).
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

// Splits text into pieces based on search matches.
function splitTextIntoSearchPieces(text: string, query: string): TextPiece[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return [{ text, isSearchMatch: false }];
    }

    const safeQuery = escapeRegExp(trimmedQuery);
    const regex = new RegExp(`(${safeQuery})`, "gi"); // Global and Case-insensitive.
    const parts = text.split(regex);

    return parts
        .filter((part) => part.length > 0)
        .map((part) => ({
            text: part,
            isSearchMatch: part.toLowerCase() === trimmedQuery.toLowerCase(),
        }));
}

// Converts pieces into React elements.
// Search matches become <mark>.
function renderSearchPieces(pieces: TextPiece[], keyPrefix: string) {
    return pieces.map((piece, index) =>
        piece.isSearchMatch ? (
            <mark
                key={`${keyPrefix}-search-${index}`}
                data-search-match="true"
                className="rounded px-1 bg-yellow-200 text-black"
            >
                {piece.text}
            </mark>
        ) : (
            <Fragment key={`${keyPrefix}-text-${index}`}>{piece.text}</Fragment>
        )
    );
}

// Breaks a string into segments, either normal text or definition matches.
// Still embeds search highlighting in both.
function buildTextSegments(text: string, query: string, definitions: Definition[]): TextSegment[] {
    if (!text) return [];

    const lowerText = text.toLowerCase();

    // Sort definitions by length so longer matches win.
    const sortedDefinitions = [...definitions]
        .filter((definition) => (definition.term ?? "").trim().length > 0)
        .sort((a, b) => (b.term?.length ?? 0) - (a.term?.length ?? 0));

    const segments: TextSegment[] = [];
    let cursor = 0;

    while (cursor < text.length) {
        let matchedDefinition: Definition | null = null;
        let matchedDefinitionLength = 0;

        // Check if a definition starts at this position.
        for (const definition of sortedDefinitions) {
            const term = (definition.term ?? "").trim();
            if (!term) continue;

            const lowerTerm = term.toLowerCase();

            if (lowerText.startsWith(lowerTerm, cursor)) {
                matchedDefinition = definition;
                matchedDefinitionLength = term.length;
                break;
            }
        }

        // If a definition match is found then wrap it.
        if (matchedDefinition && matchedDefinitionLength > 0) {
            const matchedText = text.slice(cursor, cursor + matchedDefinitionLength);

            segments.push({
                kind: "definition",
                pieces: splitTextIntoSearchPieces(matchedText, query),
                definition: matchedDefinition,
            });

            cursor += matchedDefinitionLength;
            continue;
        }

        // Otherwise just have it be plain text until the next definition match.
        let nextCursor = cursor + 1;

        while (nextCursor < text.length) {
            let startsDefinition = false;

            for (const definition of sortedDefinitions) {
                const term = (definition.term ?? "").trim();
                if (!term) continue;

                if (lowerText.startsWith(term.toLowerCase(), nextCursor)) {
                    startsDefinition = true;
                    break;
                }
            }

            if (startsDefinition) {
                break;
            }

            nextCursor += 1;
        }

        const plainText = text.slice(cursor, nextCursor);

        segments.push({
            kind: "text",
            pieces: splitTextIntoSearchPieces(plainText, query),
        });

        cursor = nextCursor;
    }

    return segments;
}

// Converts segments into React elements.
// Wraps definition segments in HoverCard.
// Still renders text segments normally with search highlighting.
function renderTextSegments(text: string, query: string, definitions: Definition[], keyPrefix: string) {
    const segments = buildTextSegments(text, query, definitions);

    return segments.map((segment, index) => {
        if (segment.kind === "definition") {
            return (
                <HoverCard key={`${keyPrefix}-definition-${index}`}>
                    <HoverCardTrigger asChild>
                        <span className="cursor-help underline decoration-dotted underline-offset-4">
                            {renderSearchPieces(segment.pieces, `${keyPrefix}-definition-pieces-${index}`)}
                        </span>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="bg-background">
                        <div className="space-y-1">
                            <div className="font-funnel font-bold text-sm text-secondary">
                                {segment.definition.term}
                            </div>
                            <div className="font-instrument text-sm text-foreground">
                                {segment.definition.definition}
                            </div>
                            {segment.definition.example?.trim() ? (
                                <div className="font-instrument text-xs italic text-muted-foreground">
                                    {segment.definition.example}
                                </div>
                            ) : null}
                        </div>
                    </HoverCardContent>
                </HoverCard>
            );
        }

        return (
            <Fragment key={`${keyPrefix}-text-segment-${index}`}>
                {renderSearchPieces(segment.pieces, `${keyPrefix}-text-pieces-${index}`)}
            </Fragment>
        );
    });
}

// Parses HTML and recursively converts it into React elements.
// Still applying both search highlighting and definition hover wrapping.
function renderHtmlContentWithHighlightsAndDefinitions(
    html: string,
    query: string,
    definitions: Definition[]
) {
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let keyCounter = 0;

    const renderNode = (node: Node): React.ReactNode => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || "";
            return (
                <Fragment key={`text-${keyCounter++}`}>
                    {renderTextSegments(text, query, definitions, `segment-${keyCounter}`)}
                </Fragment>
            );
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (["script", "style"].includes(tagName)) {
            return null;
        }

        const props: Record<string, unknown> = {
            key: `element-${keyCounter++}`,
        };

        Array.from(element.attributes).forEach((attribute) => {
            if (attribute.name === "class") {
                props.className = attribute.value;
            } else {
                props[attribute.name] = attribute.value;
            }
        });

        const children = Array.from(element.childNodes).map((childNode) =>
            renderNode(childNode)
        );

        return React.createElement(tagName, props, ...children);
    };

    return Array.from(doc.body.childNodes).map((childNode) => renderNode(childNode));
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

export default function SectionCard({ section, definitions, onEdit, onDelete, open, onOpenChange, searchQuery = "", isActiveSearchResult = false, activeField = null, activeOccurrenceIndex = null,}: SectionCardProps) {

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

    const highlightedBodyContent = useMemo(() => {
        return renderHtmlContentWithHighlightsAndDefinitions(
            section.body ?? "",
            searchQuery,
            definitions
        );
    }, [section.body, searchQuery, definitions]);

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
        }, [searchQuery, isActiveSearchResult, activeField, activeOccurrenceIndex, open, highlightedBodyContent]);

        useEffect(() => {
            if (searchQuery.trim()) return;
            clearActiveMatch();
        }, [searchQuery]);

    return(

        <Card
            className={`bg-background m-0 border-none w-full shadow-none ${
                isActiveSearchResult ? "ring-2 ring-secondary" : ""
            }`}
        >

            <CardHeader>

                <CardTitle
                    ref={titleRef}
                    className="text-left font-instrument font-bold text-2xl text-secondary sm:text-3xl italic"
                >
                    <span className="inline-block bg-primary-foreground px-2 py-1 ">
                        {highlightedTitle}
                    </span>
                </CardTitle>

                <CardDescription
                    ref={descriptionRef}
                    className="text-left font-funnel font-thin text-md text-foreground sm:text-lg"
                >
                    <span className="inline-block bg-primary-foreground px-2">
                        {highlightedDescription}
                    </span>
                </CardDescription>
            
                <CardAction >
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground/80 hover:text-secondary hover:bg-secondary/10 hover:cursor-pointer"
                                aria-label="Edit section"
                                onClick={() => onEdit(section)}
                                >
                                <PencilLine className="h-4 w-4" />
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
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer"
                                    aria-label="Delete section"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </HoverCardTrigger>
                            </DialogTrigger>

                            <DialogContent className="border-none">
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
                <Collapsible open={open} onOpenChange={onOpenChange} className="data-[state=open]:bg-background rounded-md">
                
                    <CollapsibleTrigger asChild className="mb-2">
                        <Button 
                        variant="ghost" 
                        className="group w-full rounded-none bg-primary-foreground hover:bg-secondary hover:cursor-pointer" 
                        aria-label="Expand Section"
                        >
                            View Section
                            <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent 
                        className="
                            flex flex-col items-start gap-2 p-2.5 pt-0 text-lg font-instrument
                            [&_p]:min-h-[1em]
                            [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-4
                            [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mb-3
                            [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mb-2
                            [&_ul]:list-disc [&_ul]:ml-6
                            [&_ol]:list-decimal [&_ol]:ml-6
                            [&_li]:my-1
                            [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2
                        "
                    >
                        <div
                            ref={bodyRef}
                        >
                            {highlightedBodyContent}
                        </div>
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
