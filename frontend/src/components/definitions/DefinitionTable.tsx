import { Fragment, memo, useEffect, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Crown, PencilLine, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import type { Definition } from "@/api/sectionsApi";
import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "../ui/avatar";
import { AVATAR_MAP } from "@/constants/avatars";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type DefinitionTableProps = {
  definitions: Definition[];
  onEdit: (def: Definition) => void;
  onDelete: (id: string) => void;
  searchQuery?: string;
  matchingDefinitionIds?: Set<string>;
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

type DefinitionRowProps = {
  def: Definition;
  index: number;
  shouldHighlight: boolean;
  isActiveDefinition: boolean;
  searchQuery: string;
  activeField: "term" | "definition" | "example" | null;
  activeOccurrenceIndex: number | null;
  onEdit: (def: Definition) => void;
  onDelete: (id: string) => void;
  rowRef: React.Ref<HTMLTableRowElement>;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getWholeWordSearchRegex(query: string): RegExp {
  return new RegExp(`(\\b${escapeRegExp(query.trim())}\\b)`, "gi");
}

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

  const regex = getWholeWordSearchRegex(trimmedQuery);
  const parts = text.split(regex);
  const normalizedQuery = trimmedQuery.toLowerCase();

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === normalizedQuery;

        if (!isMatch) {
          return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
        }

        const currentMatchIndex = parts
          .slice(0, index + 1)
          .filter((candidate) => candidate.toLowerCase() === normalizedQuery)
          .length - 1;

        const isActiveMatch =
          isActiveField &&
          activeOccurrenceIndex !== null &&
          currentMatchIndex === activeOccurrenceIndex;

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

const DefinitionRow = memo(function DefinitionRow({
  def,
  index,
  shouldHighlight,
  isActiveDefinition,
  searchQuery,
  activeField,
  activeOccurrenceIndex,
  onEdit,
  onDelete,
  rowRef,
}: DefinitionRowProps) {
  const sortedContributors = useMemo(
    () =>
      [...def.contributors].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [def.contributors]
  );

  const creator = sortedContributors[0];
  const lastEditor = sortedContributors[sortedContributors.length - 1];
  const effectiveQuery = shouldHighlight ? searchQuery : "";

  return (
    <TableRow
      ref={rowRef}
      className={
        isActiveDefinition
          ? "border-0 bg-secondary/15 transition-colors duration-150"
          : index % 2 === 0
            ? "border-0 bg-background hover:bg-secondary/10 transition-colors duration-150"
            : "border-0 bg-sidebar hover:bg-secondary/10 transition-colors duration-150"
      }
    >
      <TableCell className="px-5 py-5 align-top font-semibold break-words whitespace-normal text-foreground">
        <HighlightedText
          text={def.term ?? ""}
          query={effectiveQuery}
          isActiveField={isActiveDefinition && activeField === "term"}
          activeOccurrenceIndex={isActiveDefinition ? activeOccurrenceIndex : null}
        />
      </TableCell>
      <TableCell className="px-5 py-5 align-top break-words whitespace-normal text-foreground">
        <HighlightedText
          text={def.definition ?? ""}
          query={effectiveQuery}
          isActiveField={isActiveDefinition && activeField === "definition"}
          activeOccurrenceIndex={isActiveDefinition ? activeOccurrenceIndex : null}
        />
      </TableCell>
      <TableCell className="px-5 py-5 align-top break-words whitespace-normal text-foreground">
        <HighlightedText
          text={def.example ?? ""}
          query={effectiveQuery}
          isActiveField={isActiveDefinition && activeField === "example"}
          activeOccurrenceIndex={isActiveDefinition ? activeOccurrenceIndex : null}
        />
      </TableCell>
      <TableCell className="px-5 py-5 align-top">
        <AvatarGroup className="overflow-visible">
          {creator ? (
            <Link to={`/profile/${creator.userId}`}>
              <Avatar className="overflow-visible">
                <div className="overflow-hidden rounded-full">
                  <AvatarImage
                    src={
                      creator.profilePic
                        ? AVATAR_MAP[creator.profilePic]
                        : "https://github.com/shadcn.png"
                    }
                  />
                </div>
                <AvatarFallback>{creator.username?.[0] ?? "?"}</AvatarFallback>
                <AvatarBadge className="left-0 bg-secondary">
                  <Crown className="text-background bg-secondary rounded-full" />
                </AvatarBadge>
              </Avatar>
            </Link>
          ) : (
            "N/A"
          )}
          {lastEditor && lastEditor !== creator ? (
            <Link to={`/profile/${lastEditor.userId}`}>
              <Avatar size="sm">
                <AvatarImage
                  src={
                    lastEditor.profilePic
                      ? AVATAR_MAP[lastEditor.profilePic]
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>{lastEditor.username?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            ""
          )}
        </AvatarGroup>
      </TableCell>
      <TableCell className="px-5 py-5 align-top text-right">
        <div className="flex items-start justify-end gap-1">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/80 hover:text-secondary hover:bg-secondary/10 hover:cursor-pointer"
                aria-label="Edit definition"
                onClick={() => onEdit(def)}
              >
                <PencilLine className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>

            <HoverCardContent side="top" className="bg-background">
              <div className="font-instrument text-xs text-center text-foreground ">
                Edit the definition title, description, and example to better reflect the term.
              </div>
            </HoverCardContent>
          </HoverCard>

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
        </div>
      </TableCell>
    </TableRow>
  );
});

export default function DefinitionTable({
  definitions,
  onEdit,
  onDelete,
  searchQuery = "",
  matchingDefinitionIds = new Set<string>(),
  activeDefinitionId = null,
  activeField = null,
  activeOccurrenceIndex = null,
}: DefinitionTableProps) {
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);

  const activeDefinitionExists = useMemo(() => {
    if (!activeDefinitionId) return false;
    return definitions.some((definition) => definition._id === activeDefinitionId);
  }, [activeDefinitionId, definitions]);

  useEffect(() => {
    if (!activeDefinitionExists) return;
    activeRowRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, [activeDefinitionExists, activeDefinitionId, activeField, activeOccurrenceIndex]);

  return (
    <div className="w-full overflow-x-auto bg-background">
      <Table className="w-full min-w-[700px] border-0 border-collapse">
        <TableCaption className="capitalize font-funnel font-bold">
          Definitions Table
        </TableCaption>
        <TableHeader className="bg-sidebar border-0 [&_tr]:border-0">
          <TableRow className="border-0">
            <TableHead className="w-2/12 px-5 py-4 text-base font-semibold tracking-wide text-foreground">Term</TableHead>
            <TableHead className="w-3/12 px-5 py-4 text-base font-semibold tracking-wide text-foreground">Definition</TableHead>
            <TableHead className="w-4/12 px-5 py-4 text-base font-semibold tracking-wide text-foreground">Example</TableHead>
            <TableHead className="w-1/12 px-5 py-4 text-base font-semibold tracking-wide text-foreground">Added By</TableHead>
            <TableHead className="w-1/12 px-5 py-4 text-center text-base font-semibold tracking-wide text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {definitions.map((def, index) => {
            const isActiveDefinition = activeDefinitionId === def._id;
            const shouldHighlight = isActiveDefinition || matchingDefinitionIds.has(def._id);

            return (
              <DefinitionRow
                key={def._id}
                def={def}
                index={index}
                shouldHighlight={shouldHighlight}
                isActiveDefinition={isActiveDefinition}
                searchQuery={searchQuery}
                activeField={isActiveDefinition ? activeField : null}
                activeOccurrenceIndex={
                  isActiveDefinition ? activeOccurrenceIndex : null
                }
                onEdit={onEdit}
                onDelete={onDelete}
                rowRef={isActiveDefinition ? activeRowRef : null}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
