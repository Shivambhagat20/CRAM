import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";

import { 
  List, 
  type RowComponentProps,
} from "react-window";

// UI Components
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import * as utils from "../utils/homeHelpers"

/* TYPES */
type CourseFromAPI = {
  _id?: string;
  title: string;
  subject: string;
  number: string;
  courseCode: string;
  description: string;
  credits: number;
  prerequisites: string;
  attributes: string;
};

type CourseUI = CourseFromAPI & {
  id: string;
  _search: string; // Title + courseCode only.
  hasPrereqs: boolean;
  hasLab: boolean;
  attributesList: string[];
};

// Currently 0 as search is very fast right now.
function useDebouncedValue<T>(value: T, delay = 0) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// Measures its own height and reports it (proper cleanup).
function MeasuredRow(props: {
  id: string;
  onMeasure: (id: string, height: number) => void;
  children: React.ReactNode;
}) {
  const { id, onMeasure, children } = props;
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const report = () => onMeasure(id, el.getBoundingClientRect().height);

    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);

    return () => ro.disconnect();
  }, [id, onMeasure]);

  return (
    <div ref={ref} className="px-2 sm:px-3 py-2">
      {children}
    </div>
  );
}

type RowExtraProps = {
  items: CourseUI[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onMeasure: (id: string, index: number, height: number) => void;
};

export default function Home() {
  const [data, setData] = useState<CourseFromAPI[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Forces rerender when heights change (ref updates alone won't rerender).
  const [sizeVersion, setSizeVersion] = useState(0);

  const debouncedQuery = useDebouncedValue(query, 0);
  const deferredQuery = useDeferredValue(debouncedQuery);

  type ListHandle = {
    readonly element: HTMLDivElement | null;
    scrollToRow: (config: {
      index: number;
      align?: "center" | "auto" | "end" | "smart" | "start";
      behavior?: "auto" | "instant" | "smooth";
    }) => void;
  };

  // Inferred type from list.
  const listRef = useRef<ListHandle | null>(null);

  // Height cache.
  const heightMapRef = useRef<Record<string, number>>({});

  const BOTTOM_SPACER = 24;

  // Capture wheel anywhere in the page container and forward it to the List scroller.
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const handler = (e: WheelEvent) => {
      const scroller = listRef.current?.element; // The react-window List exposes its scroll element here.
      if (!scroller) return;

      // If the wheel happened inside the list already, let the list handle it normally.
      if (scroller.contains(e.target as Node)) return;

      // Prevent default page scroll and forward the delta to the list.
      e.preventDefault();
      scroller.scrollTop += e.deltaY;
    };

    // False so we can call preventDefault().
    root.addEventListener("wheel", handler, { passive: false });

    return () => {
      root.removeEventListener("wheel", handler as EventListener);
    };
  }, []);

  /* FETCH COURSES */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/v1/courses");
        if (!res.ok) throw new Error("Failed to fetch courses!");
        const json = await res.json();

        const courses: CourseFromAPI[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.courses)
          ? json.courses
          : [];

        setData(courses);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  /* BUILD UI COURSE + PRECOMPUTE SEARCH */
  const allCourses: CourseUI[] = useMemo(() => {
    const safe = (s?: string) => String(s ?? "").toLowerCase();

    return data.map((course) => {
      const id = utils.slugifyCourseCode(course.courseCode);
      const attributesList = utils.normalizeAttributes(course.attributes);

      // Mongo will default empty strings to "None".
      const prereqText = (course.prerequisites ?? "").toLowerCase().trim();
      const hasPrereqs = !!prereqText && !/^none|n\/a|no prerequisite/i.test(prereqText);

      const hasLab = utils.inferHasLab(attributesList, course.attributes);

      return {
        ...course,
        id,
        attributesList,
        hasPrereqs,
        hasLab,
        _search: [course.title, course.courseCode].map(safe).join(" "),
      };
    });
  }, [data]);

  /* SEARCH FILTER */
  const filteredCourses = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((c) => c._search.includes(q));
  }, [allCourses, deferredQuery]);

  // Reset cache when results change (prevents stale heights causing gaps).
  useEffect(() => {
    heightMapRef.current = {};
    setSizeVersion((v) => v + 1);

    // If expanded course disappears due to filtering, collapse it.
    setExpandedId((cur) => {
      if (!cur) return cur;
      return filteredCourses.some((c) => c.id === cur) ? cur : null;
    });
  }, [filteredCourses]);

  const getRowHeight = useCallback(
    (index: number) => {
      // Spacer row at end for a bit of breathing room.
      if (index === filteredCourses.length) return BOTTOM_SPACER;

      const course = filteredCourses[index];
      return heightMapRef.current[course?.id] ?? 110;
    },
    [filteredCourses, sizeVersion] // Needs sizeVersion to force recalculation.
  );

  // Measure + reset from the changed row (prevents overlap and huge blank gaps).
  const setRowHeight = useCallback((id: string, _index: number, height: number) => {
    const safe = Math.max(120, Math.ceil(height));
    const prev = heightMapRef.current[id];
    if (prev && Math.abs(prev - safe) < 4) return;

    heightMapRef.current = { ...heightMapRef.current, [id]: safe };
    setSizeVersion((v) => v + 1);
  }, []);

  // Toggle expansion + recompute layout after DOM commits.
  const toggleExpanded = useCallback(
    (id: string) => {
      const idx = filteredCourses.findIndex((c) => c.id === id);
      if (idx < 0) return;

      // Optimistic bump to prevent a frame of overlap before ResizeObserver happens.
      heightMapRef.current = {
        ...heightMapRef.current,
        [id]: Math.max(heightMapRef.current[id] ?? 220, 420),
      };
      setSizeVersion((v) => v + 1);

      setExpandedId((cur) => (cur === id ? null : id));

      requestAnimationFrame(() => {
        listRef.current?.scrollToRow?.({ index: idx, align: "smart", behavior: "instant" });
      });
    },
    [filteredCourses]
  );

  const Row = ({
    index,
    style,
    items,
    expandedId,
    onToggle,
    onMeasure,
  }: RowComponentProps<RowExtraProps>) => {
    // Bottom spacer row.
    if (index === items.length) {
      return <div style={style} />;
    }

    const course = items[index];
    const expanded = expandedId === course.id;

    return (
      <div style={style} className="w-full">
        <MeasuredRow id={course.id} onMeasure={(id, h) => onMeasure(id, index, h)}>
          <Card className="bg-card/95 border border-border/80 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 rounded-2xl">
          <CardHeader className="pb-2">
            <div>
              <Link to={`/course/${course.id}`}>
                <CardTitle className="font-[var(--font-funnel)] text-base sm:text-lg md:text-xl hover:text-secondary transition-colors leading-tight">
                  {course.title}
                </CardTitle>
              </Link>

              <CardDescription className="text-xs sm:text-sm text-secondary">
                {course.subject} {course.number}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {expanded && (
              <>
                <p className="text-sm sm:text-[15px] opacity-90 whitespace-pre-wrap leading-relaxed font-[var(--font-instrument)]">
                  {course.description}
                </p>

                <div className="mt-4 text-xs sm:text-sm opacity-80 flex flex-wrap gap-x-4 gap-y-2 items-center">
                  <span>Credits: {course.credits}</span>

                  <span>{course.hasPrereqs ? "Has Prerequisite(s)" : "No Prerequisites"}</span>

                  <span className="inline-flex flex-wrap gap-1">
                      {course.attributesList.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center rounded-lg bg-secondary text-background px-2.5 py-0.5 text-[11px] sm:text-xs"
                        >
                          {a}
                        </span>
                      ))}
                    </span>
                </div>
              </>
            )}

            {/* Subtle toggle */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => onToggle(course.id)}
                className="text-xs sm:text-sm text-muted-foreground hover:text-secondary transition-colors font-medium hover:cursor-pointer"
                aria-expanded={expanded}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            </div>
          </CardContent>
        </Card>
        </MeasuredRow>
      </div>
    );
  };

  return (
    <div
      ref={pageRef} // Attach pageRef so wheel events can be captured.
      className="h-full min-h-0 flex flex-col overflow-hidden"
    >
      {/* Header / Search */}
      <div className="shrink-0 px-4 sm:px-6 md:px-8 py-6 md:py-8 w-full max-w-5xl mx-auto">
        <h1 className="font-[var(--font-funnel)] text-2xl sm:text-3xl md:text-4xl  font-semibold text-center tracking-tight">Find Your Course</h1>

        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}
          className="w-full sm:w-4/5 md:w-3/4 lg:w-2/3 mt-4 mx-auto"
        >
          <InputGroup className="h-11 sm:h-12 rounded-xl shadow-md border border-border bg-search">
            <InputGroupInput
              type="search"
              placeholder="Search by course name or code..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              <InputGroupButton type="submit" className="bg-search hover:bg-secondary/80 transition-colors hover:cursor-pointer">
                <SearchIcon size={18}/>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <div className="h-px w-full bg-secondary mt-6" />
      </div>

      {/* List viewport (ONLY scroller) */}
      <div className="flex-1 min-h-0 overflow-hidden w-full max-w-5xl mx-auto px-3 sm:px-6 md:px-8 pb-6">
        {loading ? (
          <div className="text-center py-10">Loading courses...</div>
        ) : error ? (
          <div className="text-center py-10 text-destructive">Error: {error}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center opacity-60 py-8">No Courses found.</div>
        ) : (
          <List
            className="w-full no-scrollbar snap-y snap-mandatory"
            style={{ height: "100%", width: "100%" }}
            rowCount={filteredCourses.length + 1} // The bottom spacer row.
            rowHeight={getRowHeight}
            rowComponent={Row}
            rowProps={{
              items: filteredCourses,
              expandedId,
              onToggle: toggleExpanded,
              onMeasure: setRowHeight,
            }}
            overscanCount={6}
            listRef={listRef}
          />
        )}
      </div>
    </div>
  );
}
