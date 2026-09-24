"use client";

import {
    useEffect,
    useMemo,
    useState
} from "react";

type MediaItem = {
    id: number;
    title: string;
    alt: string;
    url: string;
    thumbnailUrl: string;
    width: number | null;
    height: number | null;
};

export default function MediaLibrary() {
    const [
        media,
        setMedia
    ] =
        useState<MediaItem[]>([]);

    const [
        loading,
        setLoading
    ] =
        useState(true);

    const [
        error,
        setError
    ] =
        useState("");

    const [
        search,
        setSearch
    ] =
        useState("");

    useEffect(() => {
        async function loadMedia() {
            try {
                const response =
                    await fetch(
                        "/api/media",
                        {
                            cache:
                                "no-store"
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    setError(
                        data.error ||
                        "Could not load WordPress media"
                    );

                    return;
                }

                setMedia(
                    Array.isArray(
                        data.media
                    )
                        ? data.media
                        : []
                );
            } catch {
                setError(
                    "Could not load WordPress media"
                );
            } finally {
                setLoading(
                    false
                );
            }
        }

        loadMedia();
    }, []);

    const filteredMedia =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return media;
            }

            return media.filter(
                (item) =>
                    item.title
                        .toLowerCase()
                        .includes(
                            query
                        ) ||
                    item.alt
                        .toLowerCase()
                        .includes(
                            query
                        )
            );
        }, [
            media,
            search
        ]);

    if (loading) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">
                    Loading media library...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                            WordPress
                        </p>

                        <h2 className="mt-2 text-xl font-bold">
                            Media Library
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            {media.length} image
                            {media.length === 1
                                ? ""
                                : "s"}{" "}
                            available
                        </p>
                    </div>

                    <div className="w-full sm:max-w-xs">
                        <input
                            type="search"
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Search media..."
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>
                </div>
            </div>

            {filteredMedia.length ===
            0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-medium text-zinc-700">
                        No images found
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                        {search
                            ? "Try a different search."
                            : "This WordPress site does not currently contain any images."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {filteredMedia.map(
                        (item) => (
                            <article
                                key={
                                    item.id
                                }
                                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                            >
                                <div className="aspect-square bg-zinc-100">
                                    <img
                                        src={
                                            item.thumbnailUrl
                                        }
                                        alt={
                                            item.alt ||
                                            item.title
                                        }
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <div className="p-3">
                                    <p
                                        className="truncate text-sm font-semibold text-zinc-900"
                                        title={
                                            item.title
                                        }
                                    >
                                        {
                                            item.title
                                        }
                                    </p>

                                    <div className="mt-2 space-y-1 text-xs text-zinc-400">
                                        <p>
                                            ID{" "}
                                            {
                                                item.id
                                            }
                                        </p>

                                        {item.width &&
                                            item.height && (
                                                <p>
                                                    {
                                                        item.width
                                                    }{" "}
                                                    ×{" "}
                                                    {
                                                        item.height
                                                    }
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </article>
                        )
                    )}
                </div>
            )}
        </div>
    );
}