import type {
    AnalysisResult,
    BlockValue,
    FieldPath,
    MediaItem,
    PageStructureBlock
} from "@/types/content-agent";

import BlockReview from "./BlockReview";

type AnalysisReviewProps = {
    result: AnalysisResult;
    pageBlocks: PageStructureBlock[];
    media: MediaItem[];

    onUpdate: (
        blockIndex: number,
        path: FieldPath,
        value: BlockValue
    ) => void;

    onRemoveRow: (
        blockIndex: number,
        path: FieldPath,
        rowIndex: number
    ) => void;

    onOpenImagePicker: (
        blockIndex: number,
        path: FieldPath,
        currentValue: BlockValue
    ) => void;

    onApprove: () => void;
};

export default function AnalysisReview({
    result,
    pageBlocks,
    media,
    onUpdate,
    onRemoveRow,
    onOpenImagePicker,
    onApprove
}: AnalysisReviewProps) {
    return (
        <div>
            <div className="space-y-5">
                {result.blocks.map(
                    (
                        block,
                        blockIndex
                    ) => {
                        const pageBlock =
                            pageBlocks.find(
                                (item) =>
                                    item.instanceId ===
                                    block.instanceId
                            );

                        return (
                            <BlockReview
                                key={
                                    block.instanceId
                                }
                                block={
                                    block
                                }
                                pageBlock={
                                    pageBlock
                                }
                                blockIndex={
                                    blockIndex
                                }
                                media={
                                    media
                                }
                                onUpdate={
                                    onUpdate
                                }
                                onRemoveRow={
                                    onRemoveRow
                                }
                                onOpenImagePicker={
                                    onOpenImagePicker
                                }
                            />
                        );
                    }
                )}
            </div>

            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-zinc-200 bg-white/95 px-5 pt-5 backdrop-blur">
                <button
                    type="button"
                    onClick={onApprove}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4"
                        aria-hidden="true"
                    >
                        <path
                            d="M4 10.5L8 14.5L16 5.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    Approve &amp; populate content
                </button>

                <p className="mt-2 text-center text-xs text-zinc-400">
                    This will update the selected WordPress page.
                </p>
            </div>
        </div>
    );
}