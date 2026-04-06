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
import { useEffect, useState } from "react";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { createDefinition, updateDefinition } from "@/api/sectionsApi";
import type { Definition } from "@/api/sectionsApi";
import { ApiError } from "@/lib/errors/ApiError";
import { useAuthDialog } from "@/context/useAuthDialog";
import { BadgeAlert } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null); // remove old errors

    try {
      setLoading(true);
      const payload = { ...values, courseCode }

      if( mode === "create") {
        onSuccess?.(await createDefinition(payload));
      } else if (mode === "edit" && initialValues?._id) {
          onSuccess?.(
          await updateDefinition({ definitionId: initialValues._id, ...payload })
        );
      }

      form.reset();
    } catch (error: unknown) {
      console.error("Submission failed", error);
      if (error instanceof ApiError && error.status === 401) {
        openAuthDialog("login");
        setServerError(error.message ?? "Only logged-in users may create sections.");
      } else {
        alert("Failed to save definition");
        setServerError(error instanceof Error ? error.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
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

        <Button
          type="submit"
          disabled={loading}
          className="bg-secondary hover:cursor-pointer hover:bg-primary hover:text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? mode === "create"
              ? "Creating definition..."
              : "Updating definition..."
            : mode === "create"
              ? "Create"
              : "Update"}
        </Button>

        {serverError && (
          <div className="flex flex-row justify-center bg-secondary text-red-800 font-bold px-4 py-2 rounded-md text-sm mt-2">
            <BadgeAlert />{serverError}
          </div>
        )}
      </form>
    </Form>
  );
}