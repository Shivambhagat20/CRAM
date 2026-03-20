import { 
    Table, 
    TableBody, 
    TableCaption, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "../ui/table";
import { PencilLine, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import type { Definition } from "@/api/sectionsApi";

type DefinitionTableProps = {
  definitions: Definition[];       
  onEdit: (def: Definition) => void;
  onDelete: (id: string) => void
};

export default function DefinitionTable({definitions, onEdit, onDelete}: DefinitionTableProps) {
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
                    {definitions.map((def) =>(
                        <TableRow key={def._id}>
                            <TableCell className="font-medium break-all whitespace-normal">{def.term}</TableCell>
                            <TableCell className="break-all whitespace-normal">{def.definition}</TableCell>
                            <TableCell className="break-all whitespace-normal">{def.example}</TableCell>
                            <TableCell></TableCell> 
                            <TableCell></TableCell> 
                            <TableCell className="text-right">
                                <Button 
                                    className="hover:text-secondary hover:cursor-pointer mr-1" 
                                    aria-label="Edit definition"
                                    onClick={() => onEdit(def)}
                                >
                                    <PencilLine />
                                </Button>
                                <Button 
                                    className="hover:text-destructive hover:cursor-pointer hover:underline" 
                                    aria-label="Delete definition"
                                    onClick={() => onDelete(def._id)}
                                >
                                    <Trash2 />
                                </Button>
                            </TableCell> 
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}