import { Fragment, useEffect, useMemo, useRef } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../ui/table";
import { Crown, PencilLine, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import type { Definition } from "@/api/sectionsApi";
import { Link } from "react-router-dom";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarImage } from "../ui/avatar";
import { AVATAR_MAP } from "@/constants/avatars";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

type DefinitionTableProps = {
  definitions: Definition[];
  onEdit: (def: Definition) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
  activeDefinitionId?: string | null;
  activeField?: "term" | "definition" | "example" | null;
  activeOccurrenceIndex?: number | null;
};

type HighlightedTextProps = {
  text: string;
  query: string;
  isActiveField: boolean;
  activeOccurrenceIndex: number | null;
};

// Escapes special regex character so a user's input can be safely used.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Renders text with search matches highlighted.
// Specific occurrences get a stronger highlight.
function HighlightedText({
  text,
  query,
  isActiveField,
  activeOccurrenceIndex,
}: HighlightedTextProps) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();

        if (!isMatch) {
          return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
        }

        // Linter warning fix, was using an unnecessary dependency before.
        const matchIndex =
          parts
            .slice(0, index + 1)
            .filter(
              (candidate) =>
                candidate.toLowerCase() === trimmedQuery.toLowerCase()
            ).length - 1;

        const isActiveMatch =
          isActiveField &&
          activeOccurrenceIndex !== null &&
          matchIndex === activeOccurrenceIndex;

        return (
          <mark
            key={`${part}-${index}`}
            className={
              isActiveMatch
                ? "rounded bg-secondary px-0.5 text-background"
                : "rounded bg-yellow-200 px-0.5 text-black"
            }
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

export default function DefinitionTable({
  definitions,
  onEdit,
  onDelete,
  searchQuery = "",
  activeDefinitionId = null,
  activeField = null,
  activeOccurrenceIndex = null,
}: DefinitionTableProps) {
    // Reference to the currently active definition row so it can scrolled into view and highlighted.
    const activeRowRef = useRef<HTMLTableRowElement | null>(null);

    // Confirms the active definition still exists in the current dataset.
    const activeDefinitionExists = useMemo(() => {
        if (!activeDefinitionId) return false;
        return definitions.some((definition) => definition._id === activeDefinitionId);
    }, [activeDefinitionId, definitions]);

    // Keeps the active search result centered in view as the user navigates between matches.
    useEffect(() => {
        if (!activeDefinitionExists) return;
        activeRowRef.current?.scrollIntoView({
            behavior: "auto",
            block: "center",
        });
    }, [activeDefinitionExists, activeDefinitionId, activeField, activeOccurrenceIndex]);

    return(
        <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[700px]">
                <TableCaption className="capitalize font-funnel font-bold">Definitions Table</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-2/12">Term</TableHead>
                        <TableHead className="w-3/12">Definition</TableHead>
                        <TableHead className="w-4/12">Example</TableHead>
                        <TableHead className="w-1/12">Added By</TableHead>
                        <TableHead className="w-1/12">Updated</TableHead>
                        <TableHead className="w-1/12 text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {definitions.map((def) =>{

                        // Sort contributors by date
                        const sortedContributors = [...def.contributors].sort(
                            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                        );
                        // Earliest contributor is creator
                        const creator = sortedContributors[0];
                        // Latest contributor is last editor
                        const lastEditor = sortedContributors[sortedContributors.length - 1];

                        const isActiveDefinition = activeDefinitionId === def._id;

                        return (
                        <TableRow
                            key={def._id}
                            ref={isActiveDefinition ? activeRowRef : null}
                            className={isActiveDefinition ? "bg-secondary/10" : undefined}
                        >
                            <TableCell className="font-medium break-all whitespace-normal">
                                <HighlightedText
                                    text={def.term ?? ""}
                                    query={searchQuery}
                                    isActiveField={isActiveDefinition && activeField === "term"}
                                    activeOccurrenceIndex={isActiveDefinition ? activeOccurrenceIndex : null}
                                />
                            </TableCell>
                            <TableCell className="break-all whitespace-normal">
                                <HighlightedText
                                    text={def.definition ?? ""}
                                    query={searchQuery}
                                    isActiveField={isActiveDefinition && activeField === "definition"}
                                    activeOccurrenceIndex={isActiveDefinition ? activeOccurrenceIndex : null}
                                />
                            </TableCell>
                            <TableCell className="break-all whitespace-normal">
                                <HighlightedText
                                    text={def.example ?? ""}
                                    query={searchQuery}
                                    isActiveField={isActiveDefinition && activeField === "example"}
                                    activeOccurrenceIndex={isActiveDefinition ? activeOccurrenceIndex : null}
                                />
                            </TableCell>
                            <TableCell>
                               <AvatarGroup className="overflow-visible">
                                    {/* Creator */}
                                    {creator ? (
                                            <Link to={`/profile/${creator.userId}`}>
                                                <Avatar className="overflow-visible">
                                                    <div className="overflow-hidden rounded-full">
                                                        <AvatarImage
                                                            src={creator.profilePic ? AVATAR_MAP[creator.profilePic] : "https://github.com/shadcn.png"}
                                                        />
                                                    </div>
                                                    <AvatarFallback>{creator.username?.[0] ?? "?"}</AvatarFallback>
                                                    <AvatarBadge className="left-0 bg-secondary">
                                                        <Crown className="text-background bg-secondary rounded-full"/>
                                                    </AvatarBadge>
                                                </Avatar>
                                            </Link>
                                    ) : (
                                        "N/A"
                                    )}
                                    {/* Last Editor */}
                                    {lastEditor && lastEditor !== creator ? (
                                        <Link to={`/profile/${lastEditor.userId}`}>
                                            <Avatar size="sm" >
                                                <AvatarImage
                                                src={lastEditor.profilePic ? AVATAR_MAP[lastEditor.profilePic] : "https://github.com/shadcn.png"}
                                                />
                                                <AvatarFallback>{lastEditor.username?.[0] ?? "?"}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                    ) : (
                                        ""
                                    )}
                                </AvatarGroup>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right">
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <Button
                                            className="hover:text-secondary hover:cursor-pointer mr-1"
                                            aria-label="Edit definition"
                                            onClick={() => onEdit(def)}
                                        >
                                            <PencilLine />
                                        </Button>
                                    </HoverCardTrigger>

                                    <HoverCardContent side="top" className="bg-background">
                                        <div className="font-instrument text-xs text-center text-foreground ">
                                            Edit the definition title, description, and example to better reflect the term.
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
                                            <DialogTitle>Delete definition</DialogTitle>
                                            <DialogDescription className="capitalize">
                                                Are you sure? This action will permanently delete the definition!
                                            </DialogDescription>
                                        </DialogHeader>

                                        <Button
                                            className="bg-secondary text-primary hover:cursor-pointer hover:text-primary hover:bg-destructive"
                                            onClick={() => onDelete(def._id)}
                                        >
                                            Yes, delete this definition
                                        </Button>

                                        </DialogContent>
                                    </Dialog>

                                    <HoverCardContent side="top" className="bg-background">
                                        <div className="font-instrument text-xs text-center text-foreground">
                                            Deletes this definition. This action cannot be undone.
                                        </div>
                                    </HoverCardContent>
                                    </HoverCard>
                                )}
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </div>
    )
}
