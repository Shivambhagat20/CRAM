import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CirclePlus, Search, ChevronUp, ChevronDown, X } from "lucide-react";

import SectionCard from "@/components/sections/SectionCard";
import SectionDialog from "@/components/sections/SectionDialog";
import DefinitionDialog from "@/components/definitions/DefinitionDialog";
import DefinitionTable from "@/components/definitions/DefinitionTable";
import CourseSidebar from "@/components/layout/CourseSidebar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import type { Definition, Section } from "@/api/sectionsApi";
import {
  getCoursePage,
  deleteSection,
  deleteDefinition,
} from "@/api/sectionsApi";
import { getCourseCode } from "@/utils/courseHelpers";
import { ApiError } from "@/lib/errors/ApiError";
import { useAuthDialog } from "@/context/useAuthDialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Kbd } from "@/components/ui/kbd";

/* Preprocessing Data */

type SearchableSection = {
  title: string;
  titleLower: string;
  description: string;
  descriptionLower: string;
  bodyText: string;
  bodyTextLower: string;
  raw: Section;
};

type SearchableDefinition = {
  term: string;
  termLower: string;
  definition: string;
  definitionLower: string;
  example: string;
  exampleLower: string;
  raw: Definition;
};

/* Single Match Navigation */

type SectionSearchResult = {
  kind: "section";
  sectionId: string;
  field: "title" | "description" | "body";
  occurrenceIndexInField: number;
};

type DefinitionSearchResult = {
  kind: "definition";
  definitionId: string;
  field: "term" | "definition" | "example";
  occurrenceIndexInField: number;
};

type SearchResult = SectionSearchResult | DefinitionSearchResult;

type SectionFieldMatchCounts = {
  title: number;
  description: number;
  body: number;
};

type DefinitionFieldMatchCounts = {
  term: number;
  definition: number;
  example: number;
};

type GroupedSectionSearchResult = {
  kind: "section";
  sectionId: string;
  counts: SectionFieldMatchCounts;
  total: number;
};

type GroupedDefinitionSearchResult = {
  kind: "definition";
  definitionId: string;
  counts: DefinitionFieldMatchCounts;
  total: number;
};


// Groups individual results.
type GroupedSearchResult =
  | GroupedSectionSearchResult
  | GroupedDefinitionSearchResult;

// Used for n-gram search.
type SearchIndex = {
  sectionsByGram: Map<string, Set<string>>;
  definitionsByGram: Map<string, Set<string>>;
};

// Props for the memoized row wrapper.
type SectionCardRowProps = {
  section: Section;
  definitions: Definition[];
  query: string;
  isMatch: boolean;
  isOpen: boolean;
  isActiveMatch: boolean;
  activeField: SectionSearchResult["field"] | null;
  activeOccurrenceIndex: number | null;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => Promise<void>;
  onOpenSectionChange: (sectionId: string, nextOpen: boolean) => void;
};

/* Memoized Components */

const MemoizedSectionCard = memo(SectionCard);
const MemoizedDefinitionTable = memo(DefinitionTable);

// Renders one section card and only updates it when its own state changes.
// Prevents search navigation from re-rendering the whole section list.
const SectionCardRow = memo(function SectionCardRow({
  section,
  definitions,
  query,
  isMatch,
  isOpen,
  isActiveMatch,
  activeField,
  activeOccurrenceIndex,
  onEdit,
  onDelete,
  onOpenSectionChange,
}: SectionCardRowProps) {
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenSectionChange(section._id, nextOpen);
    },
    [onOpenSectionChange, section._id]
  );

  return (
    <div id={`section-${section._id}`} className="w-full bg-background">
      <MemoizedSectionCard
        section={section}
        definitions={definitions}
        onEdit={onEdit}
        onDelete={onDelete}
        open={isOpen}
        onOpenChange={handleOpenChange}
        searchQuery={isMatch ? query : ""}
        isActiveSearchResult={isActiveMatch}
        activeField={activeField}
        activeOccurrenceIndex={activeOccurrenceIndex}
      />
    </div>
  );
});

// Converts HTML string content into plain text.
function htmlToText(html: string): string {
  if (!html) return "";

  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}


// Counts how many times a query appears in a given string.
// Assumes both inputs are already lowercase.
function countOccurrencesInLowerText(
  lowerText: string,
  lowerQuery: string
): number {
  if (!lowerQuery) return 0;

  let count = 0;
  let startIndex = 0;

  // Loop through the string and count non-overlapping matches.
  while (true) {
    const matchIndex = lowerText.indexOf(lowerQuery, startIndex);
    if (matchIndex === -1) break;

    count += 1;
    startIndex = matchIndex + lowerQuery.length;
  }

  return count;
}

// Breaks text into small chunks so search can narrow down "likely" matches first.
// This avoids scanning every section and definition for longer queries.
// Still not 100% sure 3-gram is best.
// Reference if others want to look into this: https://en.wikipedia.org/wiki/N-gram.
function getSearchGrams(lowerText: string): string[] {
  if (!lowerText) return [];

  if (lowerText.length < 3) {
    return [lowerText];
  }

  const grams: string[] = [];

  for (let i = 0; i <= lowerText.length - 3; i += 1) {
    grams.push(lowerText.slice(i, i + 3));
  }

  return grams;
}

// Adds one searchable item into the gram index.
// This lets later searches jump straight to "likely" words.
function addToIndex(index: Map<string, Set<string>>, lowerText: string, id: string): void {
  const grams = getSearchGrams(lowerText);

  grams.forEach((gram) => {
    const existing = index.get(gram);

    if (existing) {
      existing.add(id);
      return;
    }

    index.set(gram, new Set([id]));
  });
}

// Keeps only ids that appear in every matching gram bucket.
// This gives a smaller set before doing exact substring matching.
function intersectSets<T>(sets: Set<T>[]): Set<T> {
  if (sets.length === 0) {
    return new Set();
  }

  const [first, ...rest] = [...sets].sort((a, b) => a.size - b.size);
  const result = new Set(first);

  rest.forEach((set) => {
    result.forEach((value) => {
      if (!set.has(value)) {
        result.delete(value);
      }
    });
  });

  return result;
}

// Looks up "likely" matching ids for the current query.
// Short queries skip the index because they are too broad.
function getCandidateIds(index: Map<string, Set<string>>, lowerQuery: string): Set<string> | null {
  if (!lowerQuery) {
    return null;
  }

  const grams = getSearchGrams(lowerQuery);

  if (grams.length === 0) {
    return null;
  }

  const matchingSets = grams.map((gram) => index.get(gram) ?? new Set<string>());

  return intersectSets(matchingSets);
}

// Converts a flat result index into the exact thing (with it's items, fields, and number of occurrences).
// This helped speed up navigation since we aren't building every result object up front now.
function getSearchResultAtIndex(
  groupedResults: GroupedSearchResult[],
  targetIndex: number
): SearchResult | null {
  if (groupedResults.length === 0 || targetIndex < 0) {
    return null;
  }

  let seen = 0;

  for (const result of groupedResults) {
    if (targetIndex >= seen + result.total) {
      seen += result.total;
      continue;
    }

    let offset = targetIndex - seen;

    if (result.kind === "section") {
      const fields: Array<keyof SectionFieldMatchCounts> = [
        "title",
        "description",
        "body",
      ];

      for (const field of fields) {
        const count = result.counts[field];

        if (offset < count) {
          return {
            kind: "section",
            sectionId: result.sectionId,
            field,
            occurrenceIndexInField: offset,
          };
        }

        offset -= count;
      }
    } else {
      const fields: Array<keyof DefinitionFieldMatchCounts> = [
        "term",
        "definition",
        "example",
      ];

      for (const field of fields) {
        const count = result.counts[field];

        if (offset < count) {
          return {
            kind: "definition",
            definitionId: result.definitionId,
            field,
            occurrenceIndexInField: offset,
          };
        }

        offset -= count;
      }
    }
  }

  return null;
}

export default function Course() {
  // Core state for course content.
  const {openAuthDialog} = useAuthDialog();
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const { courseId } = useParams();

  // Section dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);

  // Definition dialog state
  const [definitionOpen, setDefinitionOpen] = useState(false);
  const [editDefinition, setEditDefinition] = useState<Definition | null>(null);

  // Queries
  const [query, setQuery] = useState("");
  const [manuallyOpenSectionIds, setManuallyOpenSectionIds] = useState<string[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastRepeatedNavigationAtRef = useRef(0);

  // Sorting
  type SortMode = "alphabetical-asc" | "alphabetical-desc";
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical-asc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const updateSortMode = useCallback((nextSortMode: SortMode) => {
    setSortMode(nextSortMode);
    setActiveResultIndex(0);
  }, []);

  // Navigation
  const [showScrollTop, setShowScrollTop] = useState(false);

  //Shortcut state
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Scroll to top.
  const scrollToTop = useCallback(() => {
    globalThis.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!courseId) throw new Error("Missing course id");
  const courseCode = getCourseCode(courseId);

  // Fetches the latest course data (sections + definitions) from the backend.
  // Reused across create/edit/delete to keep UI in sync.
  const fetchCoursePage = useCallback(async (): Promise<void> => {
    try {
      const data = await getCoursePage(courseCode);
      setSections(data.sections ?? []);
      setDefinitions(data.definitions ?? []);
    } catch (err) {
      console.error(err);
    }
  }, [courseCode]);

  // Initial data load on mount or when course changes.
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await getCoursePage(courseCode);
        setSections(data.sections ?? []);
        setDefinitions(data.definitions ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInitial();
  }, [courseCode]);

  // Ctrl-f shortcut to use the search feature of the course page.
  useEffect(() => {
    const handleFindShortcut = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    globalThis.addEventListener("keydown", handleFindShortcut);

    return () => {
      globalThis.removeEventListener("keydown", handleFindShortcut);
    };
  }, []);

  // Close sort dropdown menu when clicking elsewhere.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!sortRef.current) return;

      if (!sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSortOpen]);

  // Scroll to top.
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(globalThis.scrollY > 300);
    };

    globalThis.addEventListener("scroll", handleScroll);

    return () => globalThis.removeEventListener("scroll", handleScroll);
  }, []);

  // Defaults to A -> Z order unless another is chosen.
  const sortedSections = useMemo<Section[]>(() => {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });

    const sorted = [...sections].sort((a, b) =>
      collator.compare(a.title ?? "", b.title ?? "")
    );

    if (sortMode === "alphabetical-desc") {
      sorted.reverse();
    }

    return sorted;
  }, [sections, sortMode]);

  // Defaults to A -> Z order unless another is chosen.
  const sortedDefinitions = useMemo<Definition[]>(() => {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });

    const sorted = [...definitions].sort((a, b) =>
      collator.compare(a.term ?? "", b.term ?? "")
    );

    if (sortMode === "alphabetical-desc") {
      sorted.reverse();
    }

    return sorted;
  }, [definitions, sortMode]);
  
  // Deletes a section and refreshes data.
  const handleDeleteSection = useCallback(async (section: Section): Promise<void> => {
    try {
      await deleteSection({ sectionId: section._id });

      await fetchCoursePage();
    } catch (err) {
      if (err instanceof ApiError){
        openAuthDialog("login");
      } else{
          console.error(err);
          alert(err instanceof Error ? err.message : "Failed to delete section");
      }
    }
  }, [fetchCoursePage, openAuthDialog]);

  // Re-fetch after updating section.
  const handleUpdateSection = useCallback(async (): Promise<void> => {
    await fetchCoursePage();
  }, [fetchCoursePage]);

  // Re-fetch after creating or updating a definition.
  const handleAddOrUpdateDefinition = useCallback(async (): Promise<void> => {
    await fetchCoursePage();
  }, [fetchCoursePage]);

  // Deletes a definition and refreshes data.
  const handleDeleteDefinition = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteDefinition({ definitionId: id });
      await fetchCoursePage();
    } catch (err) {
      if (err instanceof ApiError){
        openAuthDialog("login");;
      } else{
          console.error("failed to delete definition:", err);
      }
    }
  }, [fetchCoursePage, openAuthDialog]);


  // Opens the section dialog with the selected section loaded in.
  // Keeping this callback stable helps memoized section cards avoid extra re-renders.
  const handleEditSectionOpen = useCallback((selectedSection: Section): void => {
    setEditSection(selectedSection);
    setOpenCreate(true);
  }, []);

  // Updates the local open-state list for a single section.
  // This keeps expansion changes targeted to just the section that changed.
  const handleSectionOpenChange = useCallback(
    (sectionId: string, nextOpen: boolean): void => {
      setManuallyOpenSectionIds((prev) =>
        nextOpen
          ? [...new Set([...prev, sectionId])]
          : prev.filter((id) => id !== sectionId)
      );
    },
    []
  );

  // Opens the definition dialog with the selected definition loaded in.
  // Keeping this callback stable helps the definition table avoid extra re-renders.
  const handleEditDefinitionOpen = useCallback((definition: Definition): void => {
    setEditDefinition(definition);
    setDefinitionOpen(true);
  }, []);

  // Prepares sections for searching by:
  // - Normalizing text (lowercase)
  // - Stripping HTML from body
  // - Keeping original reference
  const searchableSections = useMemo<SearchableSection[]>(() => {
    return sortedSections.map((section) => {
      const title = section.title ?? "";
      const description = section.description ?? "";
      const bodyText = htmlToText(section.body ?? "");

      return {
        title,
        titleLower: title.toLowerCase(),
        description,
        descriptionLower: description.toLowerCase(),
        bodyText,
        bodyTextLower: bodyText.toLowerCase(),
        raw: section,
      };
    });
  }, [sortedSections]);

  // Same thing as searchableSections above but for definitions.
  const searchableDefinitions = useMemo<SearchableDefinition[]>(() => {
    return sortedDefinitions.map((definition) => {
      const term = definition.term ?? "";
      const definitionText = definition.definition ?? "";
      const example = definition.example ?? "";

      return {
        term,
        termLower: term.toLowerCase(),
        definition: definitionText,
        definitionLower: definitionText.toLowerCase(),
        example,
        exampleLower: example.toLowerCase(),
        raw: definition,
      };
    });
  }, [sortedDefinitions]);

  const searchIndex = useMemo<SearchIndex>(() => {
    const sectionsByGram = new Map<string, Set<string>>();
    const definitionsByGram = new Map<string, Set<string>>();

    searchableSections.forEach((section) => {
      addToIndex(sectionsByGram, section.titleLower, section.raw._id);
      addToIndex(sectionsByGram, section.descriptionLower, section.raw._id);
      addToIndex(sectionsByGram, section.bodyTextLower, section.raw._id);
    });

    searchableDefinitions.forEach((definition) => {
      addToIndex(definitionsByGram, definition.termLower, definition.raw._id);
      addToIndex(definitionsByGram, definition.definitionLower, definition.raw._id);
      addToIndex(definitionsByGram, definition.exampleLower, definition.raw._id);
    });

    return {
      sectionsByGram,
      definitionsByGram,
    };
  }, [searchableSections, searchableDefinitions]);

  // Core search engine:
  // - Finds matches across sections and definitions
  // - Tracks which field matched
  // - Tracks occurrence index for highlighting specific matches
  const searchResults = useMemo<GroupedSearchResult[]>(() => {
    const trimmed = query.trim();
    const lowerQuery = trimmed.toLowerCase();

    if (!lowerQuery) {
      return [];
    }

    const results: GroupedSearchResult[] = [];
    const sectionCandidates =
      lowerQuery.length < 3
        ? null
        : getCandidateIds(searchIndex.sectionsByGram, lowerQuery);
    const definitionCandidates =
      lowerQuery.length < 3
        ? null
        : getCandidateIds(searchIndex.definitionsByGram, lowerQuery);

    // Search through sections.
    searchableSections.forEach((section) => {
      if (sectionCandidates !== null && !sectionCandidates.has(section.raw._id)) {
        return;
      }

      const counts: SectionFieldMatchCounts = {
        title: countOccurrencesInLowerText(section.titleLower, lowerQuery),
        description: countOccurrencesInLowerText(
          section.descriptionLower,
          lowerQuery
        ),
        body: countOccurrencesInLowerText(section.bodyTextLower, lowerQuery),
      };

      const total = counts.title + counts.description + counts.body;

      if (total === 0) {
        return;
      }

      results.push({
        kind: "section",
        sectionId: section.raw._id,
        counts,
        total,
      });
    });

    // Search through definitions.
    searchableDefinitions.forEach((definition) => {
      if (
        definitionCandidates !== null &&
        !definitionCandidates.has(definition.raw._id)
      ) {
        return;
      }

      const counts: DefinitionFieldMatchCounts = {
        term: countOccurrencesInLowerText(definition.termLower, lowerQuery),
        definition: countOccurrencesInLowerText(
          definition.definitionLower,
          lowerQuery
        ),
        example: countOccurrencesInLowerText(definition.exampleLower, lowerQuery),
      };

      const total = counts.term + counts.definition + counts.example;

      if (total === 0) {
        return;
      }

      results.push({
        kind: "definition",
        definitionId: definition.raw._id,
        counts,
        total,
      });
    });

    return results;
  }, [query, searchableSections, searchableDefinitions, searchIndex]);

  const isSearching = query.trim().length > 0;

  const totalSearchResults = useMemo<number>(() => {
    return searchResults.reduce((sum, result) => sum + result.total, 0);
  }, [searchResults]);

  // IDs of sections that contain matches (for highlighting).
  const matchingSectionIds = useMemo<Set<string>>(() => {
    return new Set(
      searchResults
        .filter(
          (result): result is GroupedSectionSearchResult => result.kind === "section"
        )
        .map((result) => result.sectionId)
    );
  }, [searchResults]);

  // Sections automatically expanded when searching.
  const autoOpenSectionIds = useMemo<string[]>(() => {
    if (!isSearching) {
      return [];
    }

    return [
      ...new Set(
        searchResults
          .filter(
            (result): result is GroupedSectionSearchResult =>
              result.kind === "section"
          )
          .map((result) => result.sectionId)
      ),
    ];
  }, [isSearching, searchResults]);

  // Final list of sections is both sections opened by the user and auto-expanded from above.
  const openSectionIds = useMemo<string[]>(() => {
    return [...new Set([...manuallyOpenSectionIds, ...autoOpenSectionIds])];
  }, [manuallyOpenSectionIds, autoOpenSectionIds]);

  // Ensures active index stays within bounds, was causing issues with linter.
  const safeActiveResultIndex = useMemo<number>(() => {
    if (totalSearchResults === 0) {
      return 0;
    }

    return Math.min(activeResultIndex, totalSearchResults - 1);
  }, [activeResultIndex, totalSearchResults]);

  const activeResult = useMemo<SearchResult | null>(() => {
    return getSearchResultAtIndex(searchResults, safeActiveResultIndex);
  }, [searchResults, safeActiveResultIndex]);

  const activeDefinitionResult =
    activeResult !== null && activeResult.kind === "definition"
      ? activeResult
      : null;

  // Holding enter was causing crazy jumps in search.
  // This will will throttle repeated key presses (like when holding enter).
  // I have it at 33ms of delay before it ignores input to try and keep it at ~30 fps in the worst case.
  const shouldHandleRepeatedNavigation = useCallback((isRepeatedKeydown: boolean): boolean => {
    if (!isRepeatedKeydown) {
      return true;
    }

    const now = performance.now();

    if (now - lastRepeatedNavigationAtRef.current < 33) {
      return false;
    }

    lastRepeatedNavigationAtRef.current = now;
    return true;
  }, []);

  // Navigation helpers for search results
  const goToNextResult = useCallback((step = 1): void => {
    if (!isSearching || totalSearchResults === 0) {
      return;
    }

    setActiveResultIndex(
      (prev) => (prev + step + totalSearchResults) % totalSearchResults
    );
  }, [isSearching, totalSearchResults]);

  // Navigation helpers for search results
  const goToPreviousResult = useCallback((step = 1): void => {
    if (!isSearching || totalSearchResults === 0) {
      return;
    }

    setActiveResultIndex(
      (prev) => ((prev - step) % totalSearchResults + totalSearchResults) % totalSearchResults
    );
  }, [isSearching, totalSearchResults]);

  // List of all section IDs.
  const allSectionIds = useMemo<string[]>(() => {
    return sections.map((section) => section._id);
  }, [sections]);

  // Checks if every section is currently open.
  const areAllSectionsOpen = useMemo<boolean>(() => {
    if (sections.length === 0) return false;

    return allSectionIds.every((id) => openSectionIds.includes(id));
  }, [allSectionIds, openSectionIds, sections.length]);

  // Opens all sections by adding every section ID to the manual open state.
  const handleExpandAllSections = useCallback((): void => {
    setManuallyOpenSectionIds(allSectionIds);
  }, [allSectionIds]);

  // Closes all manually opened sections.
  const handleCollapseAllSections = useCallback((): void => {
    setManuallyOpenSectionIds([]);
  }, []);

  /* Hotkey Helpers */
  const clearSearch = useCallback(() => {
    setQuery("");
    setActiveResultIndex(0);
    searchInputRef.current?.blur();
  }, []);

  const openNewSection = useCallback(() => {
    setEditSection(null);
    setOpenCreate(true);
  }, []);

  const openNewDefinition = useCallback(() => {
    setEditDefinition(null);
    setDefinitionOpen(true);
  }, []);

  const toggleSortMode = useCallback(() => {
    updateSortMode(
      sortMode === "alphabetical-asc"
        ? "alphabetical-desc"
        : "alphabetical-asc"
    );
  }, [sortMode, updateSortMode]);

  const toggleAllSections = useCallback(() => {
    if (areAllSectionsOpen) {
      setManuallyOpenSectionIds([]);
      return;
    }

    setManuallyOpenSectionIds(allSectionIds);
  }, [areAllSectionsOpen, allSectionIds]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const key = e.key.toLowerCase();

      // Detect if user is currently typing in an input area.
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ESC
      // Clears the current search and resets navigation.
      if (key === "escape") {
        if (query) {
          e.preventDefault();
          clearSearch();
        }
        return;
      }

      // Ignore most shortcuts while typing
      if (isTyping) return;

      // "/" focus search
      // Brings focus to the search input.
      if (key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // "?" show shortcuts
      // Opens the keyboard shortcuts window.
      if (key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // "n" / "Shift + N"
      // Creates a new section or definition depending on modifier key.
      if (key === "n") {
        e.preventDefault();

        if (e.shiftKey) {
          openNewDefinition();
        } else {
          openNewSection();
        }

        return;
      }

      // "a" toggle sort
      // Switches between ascending and descending alphabetical order.
      if (key === "a") {
        e.preventDefault();
        toggleSortMode();
        return;
      }

      // "x" expand/collapse all
      // Toggles all sections between expanded and collapsed states.
      if (key === "x") {
        e.preventDefault();
        toggleAllSections();
      }
    };

    globalThis.addEventListener("keydown", handleKeydown);
    return () => globalThis.removeEventListener("keydown", handleKeydown);
  }, [
    query,
    clearSearch,
    openNewSection,
    openNewDefinition,
    toggleSortMode,
    toggleAllSections,
  ]);

  // Controls whether the search drawer is open on smaller screens.
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);

  return (
    <SidebarProvider
      defaultOpen={true}
      className="
        [--sidebar-width:8rem]
        md:[--sidebar-width:10rem]
        lg:[--sidebar-width:12rem]
        xl:[--sidebar-width:20rem]
        2xl:[--sidebar-width:clamp(12rem,20vw,37rem)]
      "
    >
      <CourseSidebar sections={sortedSections} courseCode={courseCode} />
      <div className="fixed top-20 left-4 z-50 md:hidden">
        <SidebarTrigger className="bg-secondary text-background hover:cursor-pointer hover:bg-primary hover:text-foreground" />
      </div>
      {/* Search drawer trigger for smaller screens */}
      <div className="fixed top-20 right-4 z-50 xl:hidden">
        <Button
          size="icon-sm"
          className="bg-secondary text-background hover:bg-primary hover:text-foreground hover:cursor-pointer"
          onClick={() => setIsSearchDrawerOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      <SidebarInset className="min-w-0 flex flex-col">
        
        {/* Search drawer */}
        <Drawer
          open={isSearchDrawerOpen}
          onOpenChange={setIsSearchDrawerOpen}
          direction="bottom"
        >
          <DrawerContent className="px-4 py-4 border-none min-h-[30vh] max-h-[50vh] rounded-t-lg">
            <DrawerHeader>
              <DrawerTitle>Search</DrawerTitle>
              <DrawerDescription>Search all sections and definitions</DrawerDescription>
            </DrawerHeader>

            {/* Drawer body */}
            <div className="flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />

              <Input
                ref={searchInputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveResultIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!shouldHandleRepeatedNavigation(e.repeat)) return;
                    if (e.shiftKey) goToPreviousResult();
                    else goToNextResult();
                  }
                }}
                placeholder="Search"
                className="h-8 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveResultIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search navigation */}
            {query && (
              <div className="flex items-center justify-end gap-2 ">
                <span className="text-xs text-muted-foreground">
                  {totalSearchResults > 0
                    ? `${safeActiveResultIndex + 1}/${totalSearchResults}`
                    : "0"}
                </span>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => goToPreviousResult()}
                  disabled={totalSearchResults === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => goToNextResult()}
                  disabled={totalSearchResults === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>

        <div className="flex-1 px-6 py-6 md:px-4 bg-background ">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(16rem,22vw,24rem)]">
            {/* Left column: main page content */}
            <div className="min-w-0 bg-backround">
              {/* Course page header, this stays static, do not modify with dynamic content */}
              <div className="w-full flex flex-col items-center mb-2  sm:gap-3 ">

                <div className="self-start bg-primary-foreground px-3 py-1 mt-10 md:mt-3 shadow-2xl shadow-secondary/20">
                  <p className="text-secondary">Course Notes - {courseCode}</p>
                </div>

                <h1 className="text-3xl font-bold w-full pb-2 text-start sm:text-5xl xl:text-6xl">
                  Welcome to the{' '}
                  <span className="text-secondary italic">
                    {courseId.toUpperCase()}
                  </span>{' '}
                  Course Page!
                </h1>

                <div className="flex flex-col items-start gap-2 w-full text-start">
                  <p className=" text-lg font-thin font-instrument w-full self-start">
                    Here, you can collaborate with your classmates, find
                    resources, and review definitions about all things{" "}
                    {courseId.toUpperCase()}.
                  </p>
                  <p className=" text-lg my-2 font-thin font-instrument text-secondary italic">
                    Please remember to be respectful and follow the code of conduct while using this platform. Happy learning!
                  </p>
                </div>
              </div>

              {/* Course sections heading */}
              <div className="flex flex-row gap-2 w-full justify-between items-center p-2 my-3">
                <h2 className="text-2xl font-bold font-funnel text-left w-full mt-4 sm:text-3xl">
                  Sections
                </h2>

                <div className="flex items-center gap-2">
                  <div ref={sortRef} className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSortOpen((prev) => !prev);
                      }}
                      className="
                        whitespace-nowrap
                        border-secondary text-secondary
                        hover:bg-secondary hover:text-background
                        transition-colors
                      "
                    >
                      {sortMode === "alphabetical-asc" ? "A → Z" : "Z → A"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>

                    {isSortOpen && (
                      <div className="absolute right-0 mt-2 w-40 rounded-md border border-secondary/40 bg-background shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            updateSortMode("alphabetical-asc");
                            setIsSortOpen(false);
                          }}
                          className="
                            w-full text-left px-3 py-2 text-sm
                            text-secondary
                            hover:bg-secondary hover:text-background
                            transition-colors
                          "
                        >
                          A → Z
                        </button>

                        <div className="h-px bg-secondary/20" />

                        <button
                          onClick={() => {
                            updateSortMode("alphabetical-desc");
                            setIsSortOpen(false);
                          }}
                          className="
                            w-full text-left px-3 py-2 text-sm
                            text-secondary
                            hover:bg-secondary hover:text-background
                            transition-colors
                          "
                        >
                          Z → A
                        </button>
                      </div>
                    )}
                  </div>

                  {sections.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={
                        areAllSectionsOpen
                          ? handleCollapseAllSections
                          : handleExpandAllSections
                      }
                      className="
                        whitespace-nowrap
                        border-secondary text-secondary
                        hover:bg-secondary hover:text-background
                        transition-colors
                      "
                    >
                      {areAllSectionsOpen ? "Collapse all" : "Expand all"}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShortcuts(true)}
                    className="
                      whitespace-nowrap
                      border-secondary text-secondary
                      hover:bg-secondary hover:text-background
                      transition-colors
                    "
                  >
                    Shortcuts
                  </Button>

                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <CirclePlus
                        className="hover:text-secondary hover:cursor-pointer"
                        aria-label="Add new section"
                        onClick={() => {
                          setEditSection(null);
                          setOpenCreate(true);
                        }}
                      />
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="bg-background">
                      <div className="font-instrument text-xs text-center text-foreground">
                        Add a new section to your course page to organize your
                        content and discussions.
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>

              {/* Display section dialog */}
              <SectionDialog
                open={openCreate}
                onOpenChange={(open) => {
                  if (!open) setEditSection(null);
                  setOpenCreate(open);
                }}
                mode={editSection ? "edit" : "create"}
                courseCode={courseCode}
                initialValues={editSection ?? undefined}
                onSave={handleUpdateSection}
              />

              {/* Display sections */}
              <div className="bg-background p-2 rounded-2xl w-full space-y-3">
                {sortedSections.map((section) => {
                  const isMatch = matchingSectionIds.has(section._id);
                  const isOpen = openSectionIds.includes(section._id);

                  const isActiveMatch =
                    activeResult !== null &&
                    activeResult.kind === "section" &&
                    section._id === activeResult.sectionId;

                  const activeOccurrenceInSection = isActiveMatch
                    ? activeResult.occurrenceIndexInField
                    : null;

                  const activeFieldInSection = isActiveMatch
                    ? activeResult.field
                    : null;

                  return (
                    <SectionCardRow
                      key={section._id}
                      section={section}
                      definitions={definitions}
                      query={query}
                      isMatch={isMatch}
                      isOpen={isOpen}
                      isActiveMatch={isActiveMatch}
                      activeField={activeFieldInSection}
                      activeOccurrenceIndex={activeOccurrenceInSection}
                      onEdit={handleEditSectionOpen}
                      onDelete={handleDeleteSection}
                      onOpenSectionChange={handleSectionOpenChange}
                    />
                  );
                })}
              </div>

              {/* Definition table heading */}
              <div
                className="flex flex-row gap-2 w-full justify-between items-center p-2"
                id="definitions"
              >
                <h2 className="text-xl font-lg text-left w-full mt-4 sm:text-2xl">
                  Definitions
                </h2>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <CirclePlus
                      className="hover:text-secondary hover:cursor-pointer"
                      aria-label="Add new definition"
                      onClick={() => {
                        setEditDefinition(null);
                        setDefinitionOpen(true);
                      }}
                    />
                  </HoverCardTrigger>

                  <HoverCardContent side="top" className="bg-background">
                    <div className="font-instrument text-xs text-center text-foreground ">
                      Add a new definition to this course page
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              <DefinitionDialog
                open={definitionOpen}
                onOpenChange={setDefinitionOpen}
                courseCode={courseCode}
                mode={editDefinition ? "edit" : "create"}
                initialValues={editDefinition ?? undefined}
                onSuccess={handleAddOrUpdateDefinition}
              />

              <MemoizedDefinitionTable
                definitions={sortedDefinitions}
                onEdit={handleEditDefinitionOpen}
                onDelete={handleDeleteDefinition}
                searchQuery={query}
                activeDefinitionId={activeDefinitionResult?.definitionId ?? null}
                activeField={activeDefinitionResult?.field ?? null}
                activeOccurrenceIndex={
                  activeDefinitionResult?.occurrenceIndexInField ?? null
                }
              />
            </div>

            {/* Right Column Search */}
              <div className="hidden xl:block">
                <div className="sticky top-20 z-30">
                  {/* Search */}
                  <div className="w-full space-y-2">
                    <div className="flex w-full items-center gap-1 rounded-full border border-border/60 bg-background/85 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
                      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

                      <Input
                        ref={searchInputRef}
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setActiveResultIndex(0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();

                            if (!shouldHandleRepeatedNavigation(e.repeat)) {
                              return;
                            }

                            if (e.shiftKey) {
                              goToPreviousResult();
                            } else {
                              goToNextResult();
                            }
                          }
                        }}
                        placeholder="Search"
                        className="h-8 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />

                      {query && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery("");
                            setActiveResultIndex(0);
                            searchInputRef.current?.focus();
                          }}
                          className="p-1 rounded-full hover:bg-muted transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {isSearching && (
                        <>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {totalSearchResults > 0
                              ? `${safeActiveResultIndex + 1}/${totalSearchResults}`
                              : "0"}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full"
                            onClick={() => goToPreviousResult()}
                            disabled={totalSearchResults === 0}
                            aria-label="Previous result"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full"
                            onClick={() => goToNextResult()}
                            disabled={totalSearchResults === 0}
                            aria-label="Next result"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            {showScrollTop && (
              <Button
                onClick={scrollToTop}
                size="icon"
                className="
                  fixed bottom-6 right-6 z-50
                  border-secondary text-secondary
                  hover:bg-secondary hover:text-background
                  shadow-lg
                "
                variant="outline"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showShortcuts && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onMouseDown={() => setShowShortcuts(false)}
          >
            <div
              className="bg-background rounded-xl shadow-xl p-6 w-[90%] max-w-md"
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
            >
              <h2 id="keyboard-shortcuts-title" className="text-lg font-bold mb-4">
                Keyboard Shortcuts
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Focus search</span>
                  <span className="font-mono"><Kbd>Ctrl+F</Kbd> or <Kbd>/</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>Clear search</span>
                  <span className="font-mono"><Kbd>Esc</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>Next result</span>
                  <span className="font-mono"><Kbd>Enter</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>Previous result</span>
                  <span className="font-mono"><Kbd>Shift+Enter</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>New section</span>
                  <span className="font-mono"><Kbd>N</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>New definition</span>
                  <span className="font-mono"><Kbd>Shift+N</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>Toggle sort</span>
                  <span className="font-mono"><Kbd>A</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>Expand/collapse all</span>
                  <span className="font-mono"><Kbd>X</Kbd></span>
                </div>
                <div className="flex justify-between">
                  <span>Show shortcuts</span>
                  <span className="font-mono"><Kbd>?</Kbd></span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowShortcuts(false)}
                  variant="outline"
                  size="sm"
                  className="
                    whitespace-nowrap
                    border-secondary text-secondary
                    hover:bg-secondary hover:text-background
                    transition-colors
                  "
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
