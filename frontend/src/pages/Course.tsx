import { useParams } from "react-router-dom";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { CirclePlus } from "lucide-react";
import { useEffect, useState } from "react";
import SectionCard from "@/components/sections/SectionCard";
import DefinitionTable from "@/components/definitions/DefinitionTable";
import DefinitionDialog from "@/components/definitions/DefinitionDialog";
import SectionDialog from "@/components/sections/SectionDialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import CourseSidebar from "@/components/layout/CourseSidebar";

import type { Definition, Section } from "@/api/sectionsApi";
import { getCoursePage, deleteSection, deleteDefinition } from "@/api/sectionsApi";
import { getCourseCode } from "@/utils/courseHelpers";

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
  
  if (!courseId) throw new Error("Missing course id");
  const courseCode = getCourseCode(courseId);

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
  
  
  useEffect(() => {
      const fetchSections = async () => {
        try {
          const sectionData = await getCoursePage(courseCode)
          setSections(sectionData.sections ?? []);
          setDefinitions(sectionData.definitions ?? []);

        } catch (err: unknown) {
          console.error(err instanceof Error ? err.message : "Unknown error");
        } 
      };
  
      fetchSections();
  }, [courseCode]);

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
        <SidebarInset className="min-w-0 flex">
          <div className="flex-1 flex justify-center md:justify-start">
            <div className="w-full md:w-5/6 md:px-1  lg:w-5/6 xl:w-5/7 px-6 py-6">

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
                    <HoverCardTrigger>             
                        <CirclePlus 
                          className="w-4/5 hover:text-secondary hover:cursor-pointer"
                          aria-label="Add new section"
                          onClick={() => {
                            setEditSection(null);
                            setOpenCreate(true)}}
                            />
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="bg-background">
                      <div className="font-instrument text-xs text-center text-foreground ">
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
              <div className="bg-primary p-2 rounded-2xl w-full">

                {sections?.map((section) => (
                  <div className="w-full bg-primary" id={`section-${section._id}`}>
                    <SectionCard
                    key={section._id}
                    section={section}
                    onEdit={(s) => { setEditSection(s); setOpenCreate(true); }}
                    onDelete={handleDeleteSection}
                    />
                    {/* <Separator orientation="horizontal" /> */}
                  </div>
                ))}
              </div>

              {/* Definition table heading */}
              <div className="flex flex-row gap-2 w-full justify-between items-center p-2" id="definitions">
                <h2 className="text-xl font-lg text-left w-full mt-4 sm:text-2xl">
                  Definitions
                </h2>
                <HoverCard>

                  <HoverCardTrigger>             
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
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}