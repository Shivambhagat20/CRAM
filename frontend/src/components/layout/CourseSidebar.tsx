import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import type { Section } from "@/api/sectionsApi"

type CourseSidebarProps = {
    sections: Section[],
    courseCode: string,
}

export default function CourseSidebar({
    sections, courseCode
}: CourseSidebarProps) {

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const yOffset = -80;
            const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };
  return (
    <div >
        
        <Sidebar side="left" variant="inset">
            
            <SidebarHeader>
                {courseCode}
            </SidebarHeader> 
            {/* Scrollable content. */}
            <SidebarContent>
                {/* Section. */}
                <SidebarGroup>
                <SidebarGroupLabel>Sections</SidebarGroupLabel>
                    {sections?.map((section) => (
                        <SidebarMenuButton 
                            key={section._id}
                            className="py-5 hover:cursor-pointer hover:bg-secondary hover:text-background"
                            onClick={() => scrollTo(`section-${section._id}`)}
                        >
                            {section.title}
                        </SidebarMenuButton>
                    ))}
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Definitions</SidebarGroupLabel>
                    <SidebarMenuButton  
                        className="hover:cursor-pointer hover:bg-secondary hover:text-background"
                        onClick={() => scrollTo("definitions")}
                    >
                        Go To Definitions
                    </SidebarMenuButton>
                </SidebarGroup>
                    
            </SidebarContent>
            <SidebarFooter>
                Profile
            </SidebarFooter>
        </Sidebar>
    </div>
  )
}