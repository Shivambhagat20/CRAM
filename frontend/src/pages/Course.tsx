import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CirclePlus, Search, ChevronUp, ChevronDown } from "lucide-react";

import SectionCard from "@/components/sections/SectionCard";
import SectionDialog from "@/components/sections/SectionDialog";
import DefinitionDialog from "@/components/definitions/DefinitionDialog";
import DefinitionTable from "@/components/definitions/DefinitionTable";
import CourseSidebar from "@/components/layout/CourseSidebar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import type { Definition, Section } from "@/api/sectionsApi";
import {
  getCoursePage,
  deleteSection,
  deleteDefinition,
} from "@/api/sectionsApi";
import { getCourseCode } from "@/utils/courseHelpers";

type SearchableSection = {
  id: string;
  title: string;
  description: string;
  bodyText: string;
  raw: Section;
};

type SearchResult = {
  sectionId: string;
  field: "title" | "description" | "body";
  occurrenceIndexInField: number;
};

function htmlToText(html: string) {
  if (!html) return "";

  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

function countOccurrences(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return 0;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();

  let count = 0;
  let startIndex = 0;

  while (true) {
    const matchIndex = lowerText.indexOf(lowerQuery, startIndex);
    if (matchIndex === -1) break;

    count += 1;
    startIndex = matchIndex + lowerQuery.length;
  }

  return count;
}

export default function Course() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const { courseId } = useParams();

  // Section dialog state
  const [openCreate,setOpenCreate] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);

  // Definition dialog state
  const [definitionOpen, setDefinitionOpen] = useState(false);
  const [editDefinition, setEditDefinition] = useState<Definition | null>(null)

  // Queries
  const [query, setQuery] = useState("");
  const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  
  if (!courseId) throw new Error("Missing course id");
  const courseCode = getCourseCode(courseId);

  useEffect(() => {
    const fetchCoursePage = async () => {
      try {
        const data = await getCoursePage(courseCode);
        setSections(data.sections ?? []);
        setDefinitions(data.definitions ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCoursePage();
  }, [courseCode]);

  const handleDeleteSection = async (section: Section) => {
    try {
      await deleteSection({ sectionId: section._id});

      setSections((prev) => prev.filter((s) => s._id !== section._id));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete section");  
    }
  };

  const handleUpdateSection = async (section: Section) => {
    setSections((prev) => {
      const exists = prev.some((s) => s._id === section._id);

      if (exists) {
        return prev.map((s) => (s._id === section._id ? section : s));
      }

      return [...prev, section];
    });
  };

  const handleAddOrUpdateDefinition = (def: Definition) => {
    setDefinitions((prev) => {
      const exists = prev.some((d) => d._id === def._id);
      if (exists) return prev.map((d) => (d._id === def._id ? def : d));
      return [...prev, def];
    });
  };

  const handleDeleteDefinition = async (id: string) => {
    try {
      await deleteDefinition({definitionId: id});
      setDefinitions((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error("failed to delete definition:", err);
    }
  }

  const searchableSections = useMemo<SearchableSection[]>(() => {
    return sections.map((section) => ({
      id: section._id,
      title: section.title ?? "",
      description: section.description ?? "",
      bodyText: htmlToText(section.body ?? ""),
      raw: section,
    }));
  }, [sections]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      return [];
    }

    const results: SearchResult[] = [];

    searchableSections.forEach((section) => {
      const titleMatches = countOccurrences(section.title, trimmed);
      const descriptionMatches = countOccurrences(section.description, trimmed);
      const bodyMatches = countOccurrences(section.bodyText, trimmed);

      for (let i = 0; i < titleMatches; i += 1) {
        results.push({
          sectionId: section.raw._id,
          field: "title",
          occurrenceIndexInField: i,
        });
      }

      for (let i = 0; i < descriptionMatches; i += 1) {
        results.push({
          sectionId: section.raw._id,
          field: "description",
          occurrenceIndexInField: i,
        });
      }

      for (let i = 0; i < bodyMatches; i += 1) {
        results.push({
          sectionId: section.raw._id,
          field: "body",
          occurrenceIndexInField: i,
        });
      }
    });

    return results;
  }, [query, searchableSections]);

  const matchingSectionIds = useMemo(() => {
    return new Set(searchResults.map((result) => result.sectionId));
  }, [searchResults]);

  const safeActiveResultIndex = searchResults.length === 0 ? 0 : Math.min(activeResultIndex, searchResults.length - 1);

  const activeResult = searchResults[safeActiveResultIndex] ?? null;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const ids = [...new Set(searchResults.map((result) => result.sectionId))];
    setOpenSectionIds(ids);
  }, [query, searchResults]);

  const goToNextResult = () => {
    if (!query.trim() || searchResults.length === 0) return;

    setActiveResultIndex((prev) => (prev + 1) % searchResults.length);
  };

  const goToPreviousResult = () => {
    if (!query.trim() || searchResults.length === 0) return;

    setActiveResultIndex((prev) =>
      (prev - 1 + searchResults.length) % searchResults.length
    );
  };

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
      
      <CourseSidebar sections={sections} courseCode={courseCode}/>
      <div className="fixed top-20 left-4 z-50 md:hidden">
        <SidebarTrigger className="bg-secondary text-background hover:cursor-pointer hover:bg-primary hover:text-foreground"/>
      </div>

      <SidebarInset className="min-w-0 flex flex-col">
        <div className="flex-1 px-6 py-6 md:px-4">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(16rem,22vw,24rem)]">

            {/* Left column: main page content */}
            <div className="min-w-0">

              {/* Course page header, this stays static, do not modify with dynamic content */}
              <div className="w-full flex flex-col sm:gap-3 sm:flex-row items-center ">
                <h1 className="text-xl font-bold w-4/5 pb-2 text-center sm:text-3xl xl:text-4xl">
                  Welcome to the {courseId.toUpperCase()} Course Page!
                </h1>
                <>
                  {/* Horizontal on small screens */}
                  <Separator
                    orientation="horizontal"
                    className="bg-secondary sm:hidden my-2"
                      />

                  {/* Vertical on small screens and up */}
                  <Separator
                    orientation="vertical"
                    className="bg-secondary hidden sm:block"
                  />
                </>

                <div className="flex flex-col items-center gap-2 w-full text-center sm:text-left">
                  <p className=" text-base font-thin font-instrument w-full">
                    Here, you can collaborate with your classmates, find resources, and review definitions about all things {courseId.toUpperCase()}. 
                  </p>
                  
                  <p className=" text-base font-thin font-instrument w-full italic">
                    Please remember to be respectful and follow the code of conduct while using this platform. Happy learning!
                  </p>
                </div>
              </div>

              <Separator orientation="horizontal" className="bg-secondary "/>

              {/* Course sections heading */}        
              <div className="flex flex-row gap-2 w-full justify-between items-center p-2">
                <h2 className="text-xl font-lg text-left w-full mt-4 sm:text-2xl">
                  Sections
                </h2>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <CirclePlus 
                      className="w-4/5 hover:text-secondary hover:cursor-pointer"
                      aria-label="Add new section"
                      onClick={() => {
                        setEditSection(null);
                        setOpenCreate(true)}}
                    />
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="bg-background">
                    <div className="font-instrument text-xs text-center text-foreground">
                      Add a new section to your course page to organize your content and discussions.
                    </div>
                  </HoverCardContent>
                </HoverCard>
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

              <Separator orientation="horizontal" className="bg-foreground my-2"/>

              {/* Display sections */}
              <div className="bg-primary p-2 rounded-2xl w-full space-y-3">
                {sections.map((section) => {
                  const isMatch = matchingSectionIds.has(section._id);
                  const isSearching = !!query.trim();
                  const isOpen = isSearching
                    ? isMatch
                    : openSectionIds.includes(section._id);

                  const isActiveMatch = !!activeResult && section._id === activeResult.sectionId;

                  const activeOccurrenceInSection =
                    isActiveMatch ? activeResult.occurrenceIndexInField : null;

                  const activeFieldInSection =
                    isActiveMatch ? activeResult.field : null;

                  return (
                    <div
                      key={section._id}
                      id={`section-${section._id}`}
                      className="w-full bg-primary"
                    >
                      <SectionCard
                        section={section}
                        onEdit={(selectedSection) => {
                          setEditSection(selectedSection);
                          setOpenCreate(true);
                        }}
                        onDelete={handleDeleteSection}
                        open={isOpen}
                        onOpenChange={(nextOpen) => {
                          if (isSearching) return;

                          setOpenSectionIds((prev) =>
                            nextOpen
                              ? [...new Set([...prev, section._id])]
                              : prev.filter((id) => id !== section._id)
                          );
                        }}
                        searchQuery={isMatch ? query : ""}
                        isActiveSearchResult={isActiveMatch}
                        activeField={activeFieldInSection}
                        activeOccurrenceIndex={activeOccurrenceInSection}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Definition table heading */}
              <div className="flex flex-row gap-2 w-full justify-between items-center p-2" id="definitions">
                <h2 className="text-xl font-lg text-left w-full mt-4 sm:text-2xl">
                  Definitions
                </h2>
                <HoverCard>

                  <HoverCardTrigger asChild>             
                    <CirclePlus 
                      className="w-4/5 hover:text-secondary hover:cursor-pointer"
                      aria-label="Add new definition"
                      onClick = {() => {
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
                courseCode ={courseCode}
                mode={editDefinition ? "edit" : "create"}
                initialValues={editDefinition ?? undefined}
                onSuccess={handleAddOrUpdateDefinition}
              />

              <Separator orientation="horizontal" />
              
              <DefinitionTable
                definitions={definitions}
                onEdit={(definition) => {
                  setEditDefinition(definition);
                  setDefinitionOpen(true);
                }}
                onDelete={handleDeleteDefinition}
              />
            </div>

            {/* Right column: search */}
            <div className="hidden xl:block">
              <div className="sticky top-20 z-30">
                {/* Search */}
                <div className="w-full">
                  <div className="flex w-full items-center gap-1 rounded-full border border-border/60 bg-background/85 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

                    <Input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveResultIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (e.shiftKey) {
                            goToPreviousResult();
                          } else {
                            goToNextResult();
                          }
                        }
                      }}
                      placeholder="Search sections..."
                      className="h-8 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />

                    {query.trim() && (
                      <>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {searchResults.length > 0
                            ? `${safeActiveResultIndex + 1}/${searchResults.length}`
                            : "0"}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={goToPreviousResult}
                          disabled={searchResults.length === 0}
                          aria-label="Previous result"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full"
                          onClick={goToNextResult}
                          disabled={searchResults.length === 0}
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

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}