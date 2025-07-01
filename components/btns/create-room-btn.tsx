/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Plus, Search, Edit2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { z } from "zod";
import {
  ContentTypeEnum,
  StreamingPlatform,
} from "@/interfaces/room.interface";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { useState } from "react";

const STREAMING_PLATFORMS: StreamingPlatform[] = [
  "Netflix",
  "Disney+",
  "Hulu",
  "Prime Video",
  "HBO Max",
  "Apple TV+",
  "YouTube",
  "Peacock",
  "Paramount+",
  "Other",
];

const FormSchema = z.object({
  content_type: z.enum([ContentTypeEnum.Movie, ContentTypeEnum.Series], {
    required_error: "You need to select a content type.",
  }),
  content_tmdb_id: z.number({
    required_error: "You need to select content.",
  }),
  title: z.string().min(1, "Room title is required"),
  streaming_platform: z.enum(
    STREAMING_PLATFORMS as [StreamingPlatform, ...StreamingPlatform[]],
    {
      required_error: "You need to select a streaming platform.",
    }
  ),
  privacy_level: z.enum(["private", "public"], {
    required_error: "You need to select privacy level.",
  }),
  spoiler_policy: z.enum(["hide_spoilers", "show_with_warnings", "show_all"], {
    required_error: "You need to select spoiler policy.",
  }),
  // For series only
  starting_season: z.number().optional(),
  starting_episode: z.number().optional(),
});

type FormData = z.infer<typeof FormSchema>;
type Step = "type" | "search" | "details";

interface MockContent {
  tmdb_id: number;
  title: string;
  content_type: "movie" | "series";
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
}

// Mock search results for demo
const mockSearchResults: MockContent[] = [
  {
    tmdb_id: 1396,
    title: "Breaking Bad",
    content_type: "series",
    first_air_date: "2008-01-20",
  },
  {
    tmdb_id: 1399,
    title: "Game of Thrones",
    content_type: "series",
    first_air_date: "2011-04-17",
  },
  {
    tmdb_id: 27205,
    title: "Inception",
    content_type: "movie",
    release_date: "2010-07-16",
  },
  {
    tmdb_id: 299534,
    title: "Avengers: Endgame",
    content_type: "movie",
    release_date: "2019-04-26",
  },
];

export function CreateRoomBtn() {
  const [step, setStep] = useState<Step>("type");
  const [selectedContent, setSelectedContent] = useState<MockContent | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      privacy_level: "private",
      spoiler_policy: "hide_spoilers",
      starting_season: 1,
      starting_episode: 1,
    },
  });

  const contentType = form.watch("content_type");

  // Mock search function
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate API delay
    setTimeout(() => {
      const filtered = mockSearchResults.filter(
        (item) =>
          item.content_type === contentType &&
          item.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleContentTypeSelect = () => {
    if (contentType) {
      setStep("search");
    }
  };

  const handleEditContentType = () => {
    setStep("type");
    setSelectedContent(null);
    setSearchResults([]);
    setSearchQuery("");
    form.setValue("content_tmdb_id", 0 as any);
    form.setValue("title", "");
  };

  const handleContentSelect = (content: MockContent) => {
    setSelectedContent(content);
    form.setValue("content_tmdb_id", content.tmdb_id);
    form.setValue("title", content.title); // Default room title to content title
    setStep("details");
  };

  const handleChangeContent = () => {
    setStep("search");
    setSelectedContent(null);
    form.setValue("content_tmdb_id", 0 as any);
  };

  function onSubmit(data: FormData) {
    console.log("Form submitted:", data);
    toast.success("Room created successfully!", {
      description: `"${data.title}" is ready for your friends.`,
    });
  }

  const resetForm = () => {
    setStep("type");
    setSelectedContent(null);
    setSearchResults([]);
    setSearchQuery("");
    form.reset();
  };

  return (
    <Dialog onOpenChange={(open) => !open && resetForm()}>
      <DialogTrigger asChild>
        <div>
          <Button
            size={"default"}
            className="hidden min-[390px]:flex text-xs rounded-sm font-semibold !px-3 sm:!px-4"
          >
            <Plus />
            Create room
          </Button>

          <Button
            size={"icon"}
            className="flex min-[390px]:hidden text-xs rounded-sm font-medium !px-3 sm:!px-4"
          >
            <Plus />
          </Button>
        </div>
      </DialogTrigger>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent
            className="sm:max-w-[32.5rem]"
            fullScreenOnMobile={true}
          >
            <DialogHeader>
              <DialogTitle>🎬 Create Your Movie Room</DialogTitle>
              <DialogDescription>
                Share reactions and chat with friends as you watch
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 mt-2">
              {/* Step 1: Content Type Selection */}
              {step === "type" && (
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="content_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>
                          What type of content are you watching?
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="movie"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  Movie
                                </FormLabel>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Share reactions to specific moments and scenes
                                </p>
                              </div>
                            </FormItem>
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="series"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  TV Series
                                </FormLabel>
                                <p className=" text-muted-foreground text-xs sm:text-sm">
                                  Discuss episodes and follow story arcs
                                  together
                                </p>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Content Search */}
              {step === "search" && (
                <div className="grid gap-6">
                  {/* Content type indicator */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {contentType === "movie" ? "🎬" : "📺"} {contentType}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleEditContentType}
                      className="h-6 px-2 text-xs"
                    >
                      <Edit2 className="h-2 w-2 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <Label>
                      Search for{" "}
                      {contentType === "movie" ? "a movie" : "a TV series"}
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${
                          contentType === "movie" ? "movies" : "TV series"
                        }...`}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearch(e.target.value);
                        }}
                        className="pl-10 !text-sm"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      💡 We support content from Netflix, Disney+, Hulu, Prime
                      Video, and more
                    </p>
                  </div>

                  {/* Search Results */}
                  {searchQuery && (
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Searching...
                        </p>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((item) => (
                          <button
                            key={item.tmdb_id}
                            type="button"
                            onClick={() => handleContentSelect(item)}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent text-left"
                          >
                            <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                              {item.content_type === "movie" ? "🎬" : "📺"}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.release_date || item.first_air_date}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No results found. Try a different search term.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Room Details */}
              {step === "details" && selectedContent && (
                <div className="grid gap-6">
                  {/* Content type and selected content indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {contentType === "movie" ? "🎬" : "📺"} {contentType}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleEditContentType}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedContent.title}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleChangeContent}
                        className="h-6 px-2 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Streaming Platform */}
                  <FormField
                    control={form.control}
                    name="streaming_platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Where are you watching?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select streaming platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STREAMING_PLATFORMS.map((platform) => (
                              <SelectItem key={platform} value={platform}>
                                {platform}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* <p className="text-sm text-muted-foreground">
                          This helps friends find the content on their preferred
                          platform
                        </p> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Give your room a name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Breaking Bad Marathon"
                            className="!text-sm"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Make it personal! Examples: &quot;Weekend Horror
                          Night&quot; • &quot;Marvel Movie Marathon&quot;
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Starting Episode (Series only) */}
                  {contentType === "series" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="starting_season"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starting Season</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((season) => (
                                  <SelectItem
                                    key={season}
                                    value={season.toString()}
                                  >
                                    Season {season}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="starting_episode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starting Episode</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                  (episode) => (
                                    <SelectItem
                                      key={episode}
                                      value={episode.toString()}
                                    >
                                      Episode {episode}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Privacy Level */}
                  <FormField
                    control={form.control}
                    name="privacy_level"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Who can join your room?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="private"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  🔒 Private Room (Recommended)
                                </FormLabel>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Only people you invite can join and
                                  participate
                                </p>
                              </div>
                            </FormItem>
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="public"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  🌐 Public Room
                                </FormLabel>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Anyone with the link can discover and join
                                </p>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Spoiler Policy */}
                  <FormField
                    control={form.control}
                    name="spoiler_policy"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How should we handle spoilers?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="hide_spoilers"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  🚨 Hide spoilers (Recommended)
                                </FormLabel>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Messages about future scenes are automatically
                                  hidden
                                </p>
                              </div>
                            </FormItem>
                            {/* <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="show_with_warnings"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  ⚠️ Show spoiler warnings
                                </FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Future content is marked but still visible
                                </p>
                              </div>
                            </FormItem> */}
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="show_all"
                                  className="mt-1"
                                />
                              </FormControl>
                              <div className="grid gap-1">
                                <FormLabel className="font-medium">
                                  👁️ Show everything
                                </FormLabel>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  No spoiler protection - all messages visible
                                </p>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>

              {step === "type" && (
                <Button
                  type="button"
                  onClick={handleContentTypeSelect}
                  disabled={!contentType}
                >
                  Continue
                </Button>
              )}

              {step === "search" && !selectedContent && (
                <Button type="button" disabled>
                  Select Content First
                </Button>
              )}

              {step === "details" && (
                <Button type="submit">Create Room & Invite Friends</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
}
