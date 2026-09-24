import {
    formatBlockName
} from "@/lib/content-agent/field-utils";

import type {
    BlockResult,
    BlockValue,
    FieldPath,
    MediaItem,
    PageStructureBlock
} from "@/types/content-agent";

import FieldRenderer from "./FieldRenderer";

type BlockReviewProps = {
    block: BlockResult;
    pageBlock:
        | PageStructureBlock
        | undefined;
    blockIndex: number;
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
};

export default function BlockReview({
    block,
    pageBlock,
    blockIndex,
    media,
    onUpdate,
    onRemoveRow,
    onOpenImagePicker
}: BlockReviewProps) {
    return (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/70 px-5 py-4">
                <div>
                    <h2 className="text-base font-bold text-zinc-900">
                        {formatBlockName(
                            block.blockName
                        )}
                    </h2>

                    <p className="mt-1 text-xs text-zinc-400">
                        {
                            block.instanceId
                        }
                    </p>
                </div>

                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600">
                    AI generated
                </span>
            </div>

            <div className="space-y-5 p-5">
                {Object.entries(
                    block.fields
                ).map(
                    ([key, value]) => {
                        const field =
                            pageBlock?.schema
                                ?.fields.find(
                                    (schemaField) =>
                                        schemaField.name ===
                                        key
                                );

                        return (
                            <FieldRenderer
                                key={key}
                                value={
                                    value
                                }
                                field={
                                    field
                                }
                                blockIndex={
                                    blockIndex
                                }
                                path={[
                                    key
                                ]}
                                label={
                                    key
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
        </section>
    );
}