"use client";

import {
    useEffect,
    useState
} from "react";

import {
    addSchemaImageFields,
    formatBlockName,
    normaliseImageId,
    setNestedValue
} from "@/lib/content-agent/field-utils";

import {
    usePageStructure
} from "@/hooks/usePageStructure";

import {
    useWordPressMedia
} from "@/hooks/useWordPressMedia";

import {
    useWordPressPages
} from "@/hooks/useWordPressPages";

import type {
    AnalysisResult,
    BlockFields,
    BlockValue,
    FieldPath,
    ImagePickerTarget
} from "@/types/content-agent";

import AnalysisReview from "./AnalysisReview";
import AppShell from "./AppShell";
import ComponentSelector from "./ComponentSelector";
import ContentInput from "./ContentInput";
import ImagePickerModal from "./ImagePickerModal";
import LivePreview from "./LivePreview";
import PageSelector from "./PageSelector";

type FailedBlock = {
    instanceId: string;
    blockName: string;
    reason: string;
};

type PopulateStatus =
    | "idle"
    | "loading"
    | "success"
    | "error";

export default function ContentAgent() {
    const [content, setContent] =
        useState("");

    const [result, setResult] =
        useState<AnalysisResult | null>(
            null
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [
        failedBlocks,
        setFailedBlocks
    ] =
        useState<FailedBlock[]>([]);

    const [
        selectedPageId,
        setSelectedPageId
    ] =
        useState<number | null>(
            null
        );

    const [
        selectedInstanceIds,
        setSelectedInstanceIds
    ] =
        useState<string[]>([]);

    const [
        imagePickerTarget,
        setImagePickerTarget
    ] =
        useState<ImagePickerTarget>(
            null
        );

    const [
        selectedPreviewInstanceId,
        setSelectedPreviewInstanceId
    ] =
        useState<string | null>(
            null
        );

    const [
        populateStatus,
        setPopulateStatus
    ] =
        useState<PopulateStatus>(
            "idle"
        );

    const [
        populateMessage,
        setPopulateMessage
    ] =
        useState("");

    const {
        pages,
        loading: pagesLoading,
        error: pagesError
    } =
        useWordPressPages();

    const {
        blocks: pageBlocks,
        loading: blocksLoading,
        error: blocksError
    } =
        usePageStructure(
            selectedPageId
        );

    const {
        media,
        loading: mediaLoading,
        error: mediaError
    } =
        useWordPressMedia();

    useEffect(() => {
        if (
            selectedPageId === null &&
            pages.length > 0
        ) {
            setSelectedPageId(
                pages[0].id
            );
        }
    }, [
        pages,
        selectedPageId
    ]);

    useEffect(() => {
        if (pagesError) {
            setError(
                pagesError
            );
        }
    }, [pagesError]);

    useEffect(() => {
        if (
            !result ||
            result.blocks.length === 0
        ) {
            setSelectedPreviewInstanceId(
                null
            );

            return;
        }

        const currentStillExists =
            result.blocks.some(
                (block) =>
                    block.instanceId ===
                    selectedPreviewInstanceId
            );

        if (!currentStillExists) {
            setSelectedPreviewInstanceId(
                result.blocks[0]
                    .instanceId
            );
        }
    }, [
        result,
        selectedPreviewInstanceId
    ]);

    function resetAnalysis() {
        setResult(null);
        setError("");
        setFailedBlocks([]);
        setSelectedPreviewInstanceId(
            null
        );
    }

    function changePage(
        pageId: number
    ) {
        setSelectedPageId(
            pageId
        );

        setSelectedInstanceIds(
            []
        );

        resetAnalysis();
    }

    function toggleInstance(
        instanceId: string
    ) {
        setSelectedInstanceIds(
            (current) => {
                if (
                    current.includes(
                        instanceId
                    )
                ) {
                    return current.filter(
                        (id) =>
                            id !==
                            instanceId
                    );
                }

                return [
                    ...current,
                    instanceId
                ];
            }
        );

        resetAnalysis();
    }

    async function analyseContent() {
        if (
            !selectedPageId ||
            !content.trim() ||
            selectedInstanceIds
                .length === 0
        ) {
            return;
        }

        setLoading(true);
        setResult(null);
        setError("");
        setFailedBlocks([]);
        setSelectedPreviewInstanceId(
            null
        );

        try {
            const response =
                await fetch(
                    "/api/analyse",
                    {
                        method:
                            "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                content,
                                pageId:
                                    selectedPageId,
                                instanceIds:
                                    selectedInstanceIds
                            })
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
                    "Could not analyse content"
                );

                if (
                    Array.isArray(
                        data.failedBlocks
                    )
                ) {
                    setFailedBlocks(
                        data.failedBlocks
                    );
                }

                return;
            }

            if (!data.result) {
                setError(
                    "AI returned no content"
                );

                return;
            }

            let parsed:
                AnalysisResult;

            try {
                parsed =
                    JSON.parse(
                        data.result
                    );
            } catch {
                setError(
                    "AI returned invalid JSON"
                );

                return;
            }

            if (
                !Array.isArray(
                    parsed.blocks
                )
            ) {
                setError(
                    "AI returned an invalid block structure"
                );

                return;
            }

            const seenInstanceIds =
                new Set<string>();

            for (
                const block
                of parsed.blocks
            ) {
                if (
                    !block.instanceId ||
                    !selectedInstanceIds
                        .includes(
                            block.instanceId
                        )
                ) {
                    setError(
                        "AI returned a block outside the selected instances"
                    );

                    return;
                }

                if (
                    seenInstanceIds.has(
                        block.instanceId
                    )
                ) {
                    setError(
                        `AI returned ${block.instanceId} more than once`
                    );

                    return;
                }

                seenInstanceIds.add(
                    block.instanceId
                );
            }

            const updatedResult =
                addSchemaImageFields(
                    parsed,
                    pageBlocks
                );

            setResult(
                updatedResult
            );

            if (
                Array.isArray(
                    data.failedBlocks
                )
            ) {
                setFailedBlocks(
                    data.failedBlocks
                );
            }

            if (
                updatedResult.blocks
                    .length > 0
            ) {
                setSelectedPreviewInstanceId(
                    updatedResult
                        .blocks[0]
                        .instanceId
                );
            }
        } catch {
            setError(
                "Could not analyse content"
            );
        } finally {
            setLoading(false);
        }
    }

    function updateField(
        blockIndex: number,
        path: FieldPath,
        value: BlockValue
    ) {
        if (!result) {
            return;
        }

        const updated =
            structuredClone(result);

        updated.blocks[
            blockIndex
        ].fields =
            setNestedValue(
                updated.blocks[
                    blockIndex
                ].fields,
                path,
                value
            ) as BlockFields;

        setResult(updated);
    }

    function removeRepeaterRow(
        blockIndex: number,
        path: FieldPath,
        rowIndex: number
    ) {
        if (!result) {
            return;
        }

        const updated =
            structuredClone(result);

        let target:
            BlockValue =
            updated.blocks[
                blockIndex
            ].fields;

        for (
            const part
            of path
        ) {
            if (
                typeof part ===
                "number"
            ) {
                if (
                    !Array.isArray(
                        target
                    )
                ) {
                    return;
                }

                target =
                    target[part];
            } else {
                if (
                    !target ||
                    typeof target !==
                        "object" ||
                    Array.isArray(
                        target
                    )
                ) {
                    return;
                }

                target =
                    target[part];
            }
        }

        if (
            !Array.isArray(
                target
            )
        ) {
            return;
        }

        target.splice(
            rowIndex,
            1
        );

        setResult(updated);
    }

    function openImagePicker(
        blockIndex: number,
        path: FieldPath,
        currentValue: BlockValue
    ) {
        setImagePickerTarget({
            blockIndex,
            path,
            selectedId:
                normaliseImageId(
                    currentValue
                )
        });
    }

    function selectImage(
        mediaId: number
    ) {
        if (!imagePickerTarget) {
            return;
        }

        updateField(
            imagePickerTarget.blockIndex,
            imagePickerTarget.path,
            mediaId
        );

        setImagePickerTarget(
            null
        );
    }

    function closePopulateModal() {
        if (
            populateStatus ===
            "loading"
        ) {
            return;
        }

        setPopulateStatus(
            "idle"
        );

        setPopulateMessage(
            ""
        );
    }

    async function approveContent() {
        if (
            !result ||
            !selectedPageId ||
            populateStatus ===
                "loading"
        ) {
            return;
        }

        setError("");

        setPopulateStatus(
            "loading"
        );

        setPopulateMessage(
            "Updating WordPress content..."
        );

        try {
            const response =
                await fetch(
                    "/api/populate",
                    {
                        method:
                            "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                pageId:
                                    selectedPageId,
                                blocks:
                                    result.blocks
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                setPopulateStatus(
                    "error"
                );

                setPopulateMessage(
                    data.error ||
                    "Something went wrong while populating content"
                );

                return;
            }

            setPopulateStatus(
                "success"
            );

            setPopulateMessage(
                "Content populated successfully."
            );
        } catch {
            setPopulateStatus(
                "error"
            );

            setPopulateMessage(
                "Something went wrong while populating content"
            );
        }
    }

    const previewBlock =
        result?.blocks.find(
            (block) =>
                block.instanceId ===
                selectedPreviewInstanceId
        ) ??
        result?.blocks[0] ??
        null;

    const leftColumn = (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                    Step 1
                </p>

                <h2 className="mt-2 text-lg font-bold">
                    Select content
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                    Choose the page and components you want the AI to work with.
                </p>
            </div>

            <PageSelector
                pages={
                    pages
                }
                selectedPageId={
                    selectedPageId
                }
                loading={
                    pagesLoading
                }
                onChange={
                    changePage
                }
            />

            <ComponentSelector
                blocks={
                    pageBlocks
                }
                selectedInstanceIds={
                    selectedInstanceIds
                }
                loading={
                    blocksLoading
                }
                error={
                    blocksError
                }
                onToggle={
                    toggleInstance
                }
            />

            <div className="border-t border-zinc-200 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                    Step 2
                </p>

                <h2 className="mt-2 text-lg font-bold">
                    Add source content
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                    Paste the client copy or brief you want analysed.
                </p>
            </div>

            <ContentInput
                content={
                    content
                }
                loading={
                    loading
                }
                disabled={
                    !content.trim() ||
                    !selectedPageId ||
                    selectedInstanceIds
                        .length === 0
                }
                onChange={
                    setContent
                }
                onAnalyse={
                    analyseContent
                }
            />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {failedBlocks.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                        Some components could not be analysed
                    </p>

                    <p className="mt-1 text-sm leading-5 text-amber-700">
                        The successful components are available to review, but the following components were skipped:
                    </p>

                    <div className="mt-3 space-y-2">
                        {failedBlocks.map(
                            (failedBlock) => (
                                <div
                                    key={
                                        failedBlock.instanceId
                                    }
                                    className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2"
                                >
                                    <p className="text-sm font-semibold text-amber-900">
                                        {formatBlockName(
                                            failedBlock.blockName
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-amber-700">
                                        {
                                            failedBlock.instanceId
                                        }
                                        {" · "}
                                        {
                                            failedBlock.reason
                                        }
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const mainColumn =
        result ? (
            <div>
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Step 3
                    </p>

                    <h2 className="mt-2 text-lg font-bold">
                        Review AI content
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        Check and edit the generated content before it is sent to WordPress.
                    </p>
                </div>

                {failedBlocks.length > 0 && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-medium text-amber-800">
                            {failedBlocks.length} selected component
                            {failedBlocks.length === 1
                                ? ""
                                : "s"}{" "}
                            failed analysis and
                            {failedBlocks.length === 1
                                ? " is"
                                : " are"}{" "}
                            not included below.
                        </p>
                    </div>
                )}

                <AnalysisReview
                    result={
                        result
                    }
                    pageBlocks={
                        pageBlocks
                    }
                    media={
                        media
                    }
                    onUpdate={
                        updateField
                    }
                    onRemoveRow={
                        removeRepeaterRow
                    }
                    onOpenImagePicker={
                        openImagePicker
                    }
                    onApprove={
                        approveContent
                    }
                />
            </div>
        ) : (
            <div className="flex min-h-[520px] items-center justify-center">
                <div className="max-w-sm text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
                        AI
                    </div>

                    <h2 className="mt-5 text-xl font-bold">
                        Your analysis will appear here
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Select your components, paste the source content and run the analysis to begin reviewing generated fields.
                    </p>
                </div>
            </div>
        );

    const rightColumn = (
        <>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Preview
                    </p>

                    <h2 className="mt-2 text-lg font-bold">
                        Live preview
                    </h2>
                </div>

                {result &&
                    result.blocks.length >
                        1 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {result.blocks.map(
                                (block) => {
                                    const isActive =
                                        block.instanceId ===
                                        selectedPreviewInstanceId;

                                    return (
                                        <button
                                            key={
                                                block.instanceId
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSelectedPreviewInstanceId(
                                                    block.instanceId
                                                )
                                            }
                                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                                isActive
                                                    ? "border-violet-600 bg-violet-600 text-white"
                                                    : "border-zinc-200 bg-white text-zinc-600 hover:border-violet-300 hover:text-violet-600"
                                            }`}
                                        >
                                            {formatBlockName(
                                                block.blockName
                                            )}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    )}

                <LivePreview
                    block={
                        previewBlock
                    }
                    media={
                        media
                    }
                />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Analysis
                </p>

                <h2 className="mt-2 text-lg font-bold">
                    Summary
                </h2>

                <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
                        <span className="text-sm text-zinc-500">
                            Components selected
                        </span>

                        <span className="font-semibold">
                            {
                                selectedInstanceIds.length
                            }
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
                        <span className="text-sm text-zinc-500">
                            Components analysed
                        </span>

                        <span className="font-semibold">
                            {
                                result?.blocks.length ??
                                0
                            }
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
                        <span className="text-sm text-zinc-500">
                            Failed
                        </span>

                        <span
                            className={`font-semibold ${
                                failedBlocks.length >
                                0
                                    ? "text-amber-600"
                                    : "text-zinc-900"
                            }`}
                        >
                            {
                                failedBlocks.length
                            }
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
                        <span className="text-sm text-zinc-500">
                            WordPress
                        </span>

                        <span className="text-sm font-medium text-emerald-600">
                            Connected
                        </span>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            <AppShell
                leftColumn={
                    leftColumn
                }
                mainColumn={
                    mainColumn
                }
                rightColumn={
                    rightColumn
                }
            />

            <ImagePickerModal
                target={
                    imagePickerTarget
                }
                media={
                    media
                }
                loading={
                    mediaLoading
                }
                error={
                    mediaError
                }
                onSelect={
                    selectImage
                }
                onClose={() =>
                    setImagePickerTarget(
                        null
                    )
                }
            />

            {populateStatus !==
                "idle" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-2xl">
                        {populateStatus ===
                            "loading" && (
                            <>
                                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />

                                <h2 className="mt-6 text-xl font-bold text-zinc-900">
                                    Updating WordPress
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    {
                                        populateMessage
                                    }
                                </p>

                                <p className="mt-4 text-xs text-zinc-400">
                                    Please keep this page open while the content is being updated.
                                </p>
                            </>
                        )}

                        {populateStatus ===
                            "success" && (
                            <>
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-600">
                                    ✓
                                </div>

                                <h2 className="mt-6 text-xl font-bold text-zinc-900">
                                    Content updated
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    {
                                        populateMessage
                                    }
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        closePopulateModal
                                    }
                                    className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                                >
                                    Close
                                </button>
                            </>
                        )}

                        {populateStatus ===
                            "error" && (
                            <>
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
                                    !
                                </div>

                                <h2 className="mt-6 text-xl font-bold text-zinc-900">
                                    Update failed
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-red-600">
                                    {
                                        populateMessage
                                    }
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        closePopulateModal
                                    }
                                    className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}