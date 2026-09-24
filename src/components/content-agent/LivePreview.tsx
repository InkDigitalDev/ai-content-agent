"use client";

import {
    useEffect,
    useState
} from "react";

import {
    formatBlockName
} from "@/lib/content-agent/field-utils";

import type {
    BlockResult,
    MediaItem
} from "@/types/content-agent";

type LivePreviewProps = {
    block: BlockResult | null;
    media: MediaItem[];
};

export default function LivePreview({
    block
}: LivePreviewProps) {
    const [html, setHtml] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!block) {
            setHtml("");
            setError("");

            return;
        }

        let cancelled =
            false;

        const timeout =
            setTimeout(
                async () => {
                    setLoading(true);
                    setError("");

                    try {
                        const response =
                            await fetch(
                                "/api/preview",
                                {
                                    method:
                                        "POST",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body:
                                        JSON.stringify({
                                            blockName:
                                                block.blockName,
                                            fields:
                                                block.fields
                                        })
                                }
                            );

                        const data =
                            await response.json();

                        if (cancelled) {
                            return;
                        }

                        if (
                            !response.ok ||
                            !data.success
                        ) {
                            setHtml("");

                            setError(
                                data.error ||
                                "Could not render component preview"
                            );

                            return;
                        }

                        setHtml(
                            data.html ?? ""
                        );
                    } catch {
                        if (
                            !cancelled
                        ) {
                            setHtml("");

                            setError(
                                "Could not render component preview"
                            );
                        }
                    } finally {
                        if (
                            !cancelled
                        ) {
                            setLoading(false);
                        }
                    }
                },
                300
            );

        return () => {
            cancelled = true;

            clearTimeout(
                timeout
            );
        };
    }, [block]);

    if (!block) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
                <p className="max-w-xs text-center text-sm leading-6 text-zinc-500">
                    Run an analysis to preview generated content here.
                </p>
            </div>
        );
    }

    if (loading && !html) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="text-center">
                    <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />

                    <p className="mt-3 text-sm text-zinc-500">
                        Rendering preview...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
                    Preview error
                </p>

                <h3 className="mt-2 text-lg font-bold text-red-900">
                    {formatBlockName(
                        block.blockName
                    )}
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700">
                    {error}
                </p>
            </div>
        );
    }

    if (!html) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Preview
                </p>

                <h3 className="mt-2 text-lg font-bold text-zinc-900">
                    {formatBlockName(
                        block.blockName
                    )}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                    WordPress returned no preview markup.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <iframe
                title={`${formatBlockName(
                    block.blockName
                )} preview`}
                srcDoc={html}
                className="h-[420px] w-full border-0 bg-white"
                sandbox=""
            />
        </div>
    );
}