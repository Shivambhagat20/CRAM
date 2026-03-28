import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { createDefinition, updateDefinition } from "@/api/sectionsApi";
import type { Definition } from "@/api/sectionsApi";
import { ApiError } from "@/lib/errors/ApiError";
import { useAuthDialog } from "@/context/useAuthDialog";



type FormProps = {
  mode: "create" | "edit";
  initialValues?: Definition;
  onSuccess?: (def: Definition) => void;
  courseCode: string;
};

const formSchema = z.object({
  courseCode: z.string().min(1),
  term: z.string().min(1, { message: "Term Invalid" }),
  definition: z.string().min(5, { message: "Please add a longer definition" }),
  example: z.string().min(5, { message: "Please add some more information" }),
});

export default function DefinitionForm({
  mode,
  initialValues,
  onSuccess,
  courseCode
}: FormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: initialValues ?? {
      courseCode,
      term: "",
      definition: "",
      example: "",
    },
  });

  const {openAuthDialog} = useAuthDialog();

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {

      const  payload = { ...values, courseCode }

      if( mode === "create"){
        console.log(payload)
        onSuccess?.(await createDefinition(payload));
      } else if (mode === "edit" && initialValues?._id){
        console.log({ definitionId: initialValues._id, ...payload })
          onSuccess?.(
          await updateDefinition({ definitionId: initialValues._id, ...payload })
        );
      }

      form.reset();
    } catch (error: unknown) {
      console.error("Submission failed", error);
       if (error instanceof ApiError && error.status === 401) {
        openAuthDialog("login");
      } else {
        alert("Failed to save definition");
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Term</FormLabel>
              <FormControl>
                <Input placeholder="New Term" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="definition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Definition</FormLabel>
              <FormControl>
                <Input placeholder="Definition" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="example"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Example</FormLabel>
              <FormControl>
                <Input placeholder="Example" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {mode === "create" ? "Create" : "Update"}
        </Button>
      </form>
    </Form>
  );
}