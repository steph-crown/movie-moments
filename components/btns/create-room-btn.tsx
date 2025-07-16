/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useContentSearch } from "@/hooks/use-content-search";
import {
  ContentTypeEnum,
  CreateRoomData,
  StreamingPlatform,
} from "@/interfaces/room.interface";
import { SearchResult } from "@/interfaces/tmdb.interface";
import {
  createRoom,
  updateContentCacheWithDetailsIfNeeded,
} from "@/lib/actions/rooms";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Edit2, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { InlineLoader } from "../loaders/inline-loader";
import { Badge } from "../ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SeasonsAndEpisodeSelector } from "../season-episode-selector";
import { SeasonData } from "@/lib/utils/season.utils";

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
  spoiler_policy: z.enum(["hide_spoilers", "show_all"], {
    required_error: "You need to select spoiler policy.",
  }),
  // For series only
  starting_season: z.number().optional(),
  starting_episode: z.number().optional(),
});

type FormData = z.infer<typeof FormSchema>;
type Step = "type" | "search" | "details";

export function CreateRoomBtn({
  fullWidth,
  triggerNode,
  btnClassName,
}: {
  fullWidth?: boolean;
  triggerNode?: ReactNode;
  btnClassName?: string;
}) {
  const [step, setStep] = useState<Step>("type");
  const [selectedContent, setSelectedContent] = useState<SearchResult | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

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

  // Use the debounced search hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isLoading: isSearching,
    error: searchError,
    clearResults,
    clearError,
  } = useContentSearch(contentType || "movie");

  const handleCreateRoomClick = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setShowLoginDialog(false);
    setIsMainDialogOpen(true);
  };

  const handleLoginRedirect = () => {
    // setShowLoginDialog(false);
    router.push("/auth/login");
  };

  const handleContentTypeSelect = () => {
    if (contentType) {
      setStep("search");
    }
  };

  const handleEditContentType = () => {
    setStep("type");
    setSelectedContent(null);
    clearResults();
    setSearchQuery("");
    clearError();
    form.setValue("content_tmdb_id", 0 as any);
    form.setValue("title", "");
  };

  console.log({ spirrtititi: selectedContent });

  const handleContentSelect = (content: SearchResult) => {
    setSelectedContent(content);
    form.setValue("content_tmdb_id", content.tmdb_id);
    form.setValue("title", content.title); // Default room title to content title
    setStep("details");

    // fetch more details, like seasons and numberOfSeasons
    if (content.content_type === "series") {
      updateContentCacheWithDetailsIfNeeded(
        content.tmdb_id,
        content.content_type
      )
        .then((result) => {
          setSelectedContent((prev) => ({
            ...(prev || content),
            seasons: result.detailedContent?.seasons,
          }));
          console.log({ theresult: result });
          if (result.success && result.wasUpdated) {
            console.log("Content cache updated with detailed information");
          }
        })
        .catch((error) => {
          console.warn("Background content cache update failed:", error);
        });
    }
  };

  const handleChangeContent = () => {
    setStep("search");
    setSelectedContent(null);
    form.setValue("content_tmdb_id", 0 as any);
  };

  console.log({ selectedContent });

  async function onSubmit(data: FormData) {
    if (!user || !selectedContent) {
      setShowLoginDialog(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const roomData: CreateRoomData = {
        title: data.title,
        content_tmdb_id: data.content_tmdb_id,
        content_type: data.content_type,
        streaming_platform: data.streaming_platform,
        privacy_level: data.privacy_level,
        spoiler_policy: data.spoiler_policy,
        starting_season: data.starting_season,
        starting_episode: data.starting_episode,
      };

      // Pass the selected content data as second parameter
      const contentData = {
        tmdb_id: selectedContent.tmdb_id,
        content_type: selectedContent.content_type,
        title: selectedContent.title,
        overview: selectedContent.overview,
        poster_path: selectedContent.poster_path,
        backdrop_path: selectedContent.backdrop_path,
        release_date: selectedContent.release_date,
        first_air_date: selectedContent.first_air_date,
        seasons: selectedContent.seasons,
      };

      const result = await createRoom(roomData, contentData);

      if (result.success && result.data) {
        toast.success("Room created successfully!", {
          description: `"${result.data.title}" is ready for your friends.`,
        });

        // Reset form and close dialog
        resetForm();
        setIsMainDialogOpen(false);

        // Navigate to the new room
        router.push(`/${result.data.room_code}`);
      } else {
        toast.error("Failed to create room. Please try again");
      }
    } catch (error) {
      console.error("Room creation error:", error);
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetForm = () => {
    setStep("type");
    setSelectedContent(null);
    clearResults();
    setSearchQuery("");
    clearError();
    form.reset();
  };

  // Show loading state if auth is loading
  if (loading) {
    return (
      <div className={clsx(fullWidth && "!w-full !flex")}>
        <Button
          disabled
          size="default"
          className={clsx(
            "hidden min-[390px]:flex  font-semibold !px-3 sm:!px-4",
            fullWidth && "!w-full !flex"
          )}
        >
          <Plus />
          Loading...
        </Button>

        <Button
          disabled
          size="icon"
          className={clsx(
            "flex min-[390px]:hidden text-xs  font-medium !px-3 sm:!px-4",
            fullWidth && "!w-full !hidden"
          )}
        >
          <Plus />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Main Create Room Dialog */}
      <Dialog
        open={isMainDialogOpen}
        onOpenChange={(open) => {
          setIsMainDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger asChild>
          {triggerNode || (
            <div className={clsx(fullWidth && "!w-full")}>
              <Button
                size="default"
                onClick={handleCreateRoomClick}
                className={clsx(
                  "hidden min-[390px]:flex  font-semibold !px-3 sm:!px-4",
                  fullWidth && "!w-full flex",
                  btnClassName
                )}
              >
                <Plus />
                {/* <IconCirclePlusFilled /> */}
                Create room
              </Button>

              <Button
                size="icon"
                onClick={handleCreateRoomClick}
                className={clsx(
                  "flex min-[390px]:hidden text-xs  font-medium !px-3 sm:!px-4",
                  fullWidth && "!hidden"
                )}
              >
                <Plus />
              </Button>
            </div>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[32.5rem]" fullScreenOnMobile={true}>
          <DialogHeader>
            <DialogTitle>
              {showLoginDialog
                ? "Sign in required"
                : "🎬 Create Your Movie Room"}
            </DialogTitle>
            <DialogDescription>
              {showLoginDialog
                ? "You need to sign in to create a room and invite friends to share movie moments together."
                : "Share reactions and chat with friends as you watch"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {!showLoginDialog && (
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
                                      Share reactions to specific moments and
                                      scenes
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 !text-sm"
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          💡 We support content from Netflix, Disney+, Hulu,
                          Prime Video, and more
                        </p>
                      </div>

                      {/* Search Results */}
                      {searchQuery && (
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Searching...
                            </p>
                          ) : searchError ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-destructive mb-2">
                                {searchError}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  clearError();
                                  // Retry search by clearing and setting query again
                                  const currentQuery = searchQuery;
                                  setSearchQuery("");
                                  setTimeout(
                                    () => setSearchQuery(currentQuery),
                                    100
                                  );
                                }}
                              >
                                Try Again
                              </Button>
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((item) => (
                              <button
                                key={item.tmdb_id}
                                type="button"
                                onClick={() => handleContentSelect(item)}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent text-left"
                              >
                                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center overflow-hidden relative">
                                  {item.poster_path ? (
                                    <Image
                                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                      alt={item.title}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <span className="text-2xl">
                                      {item.content_type === "movie"
                                        ? "🎬"
                                        : "📺"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.release_date || item.first_air_date}
                                  </p>
                                  {item.overview && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {item.overview}
                                    </p>
                                  )}
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
                            {contentType === "movie" ? "🎬" : "📺"}{" "}
                            {contentType}
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
                          <Badge variant="outline">
                            {selectedContent.title}
                          </Badge>
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
                                <SelectTrigger className="w-full">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Starting Episode (Series only) */}
                      {/* {contentType === "series" && (
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
                                    <SelectTrigger className="w-full">
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
                                    <SelectTrigger className="w-full">
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
                      )} */}

                      {contentType === "series" && selectedContent?.seasons && (
                        <div className="space-y-3">
                          <SeasonsAndEpisodeSelector
                            seasons={selectedContent.seasons}
                            defaultSeason={form.watch("starting_season") || 1}
                            defaultEpisode={form.watch("starting_episode") || 1}
                            onSeasonChange={(season: SeasonData) => {
                              form.setValue("starting_season", season.number);
                            }}
                            onEpisodeChange={(episode: number) => {
                              form.setValue("starting_episode", episode);
                            }}
                            seasonLabel="Starting Season"
                            episodeLabel="Starting Episode"
                            showTimestamp={true} // Don't show timestamp in room creation
                          />
                          <p className="text-xs text-muted-foreground">
                            Choose where your group will begin watching together
                          </p>
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
                            <FormLabel>
                              How should we handle spoilers?
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
                                      value="hide_spoilers"
                                      className="mt-1"
                                    />
                                  </FormControl>
                                  <div className="grid gap-1">
                                    <FormLabel className="font-medium">
                                      🚨 Hide spoilers (Recommended)
                                    </FormLabel>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      Messages about future scenes are
                                      automatically hidden
                                    </p>
                                  </div>
                                </FormItem>
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
                                      No spoiler protection - all messages
                                      visible
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
              )}

              <DialogFooter className={showLoginDialog ? "mt-4" : "mt-6"}>
                <DialogClose asChild>
                  <Button variant="secondary" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>

                {showLoginDialog && (
                  <Button type="button" onClick={handleLoginRedirect}>
                    Log in
                  </Button>
                )}

                {!showLoginDialog && (
                  <>
                    {step === "type" && (
                      <Button
                        type="button"
                        onClick={handleContentTypeSelect}
                        disabled={!contentType || isSubmitting}
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
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => {
                          console.log({
                            values: form.getValues(),
                            errr: form.formState,
                          });
                        }}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            Creating room...
                          </div>
                        ) : (
                          "Create Room & Invite Friends"
                        )}

                        {isSubmitting && <InlineLoader />}
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

{
  /* </form>
        </Form> */
}
