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
    CardFooter, 
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
    AvatarGroup, 
} from "../ui/avatar";


import type { Section } from "@/api/sectionsApi";

type SectionCardProps = {
  section: Section;
  onEdit: (section: Section) => void;
  onDelete?: (section: Section) => void;
};

export default function SectionCard({ section, onEdit, onDelete }: SectionCardProps) {
    return(

        <Card  className="bg-primary m-0  border-none w-full">

            <CardHeader>

                <CardTitle className="text-left font-funnel font-bold text-xl text-secondary sm:text-2xl">
                    {section.title}
                </CardTitle>

                <CardDescription className="text-left font-instrument font-thin text-xs text-foreground italic sm:text-sm">
                    {section.description}
                </CardDescription>
            
                <CardAction >
                    <HoverCard>
                        <HoverCardTrigger>             
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
                            <DialogTrigger>
                            <HoverCardTrigger>
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

            <CardContent className="text-foreground break-all overflow-y-auto">

                <Collapsible className="data-[state=open]:bg-primary rounded-md">
                
                    <CollapsibleTrigger asChild className="mb-2">
                        <Button 
                        variant="ghost" 
                        className="group w-full bg-primary boder-1 border-foreground hover:bg-secondary hover:cursor-pointer" 
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
                            [&_ul]:list-disc [&_ul]:ml-6
                            [&_ol]:list-decimal [&_ol]:ml-6
                            [&_li]:my-1
                            [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2
                        "
                    >
                        <div dangerouslySetInnerHTML={{__html: section.body}}/>
                    </CollapsibleContent>
                </Collapsible>     
          </CardContent>

          <CardFooter className="text-foreground text-xs flex flex-row align-center justify-between gap-2">
                <div className="flex flex-row gap-3 items-center">
                    <p>Contributors:</p>
                    <AvatarGroup className="grayscale">
                        {/* {section.contributors?.map((c, i) => (
                            <Avatar key={i} size="sm">
                                {c.avatar ? 
                                    <AvatarImage src={c.avatar} alt={c.name} /> 
                                    : <AvatarFallback>{c.name.slice(0,2).toUpperCase()}</AvatarFallback>
                                }
                            </Avatar>
                        ))} */}


                        {/* {section.contributors && section.contributors.length > 3 && (
                            <AvatarGroupCount>+{section.contributors.length - 3}</AvatarGroupCount>
                        )} */}
                    </AvatarGroup>
                </div>
                
                {/* <p className="text-xs">Last Edited: {section.updated}</p> */}
            </CardFooter>
        </Card>
    );
}