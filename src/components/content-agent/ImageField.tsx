import {
    normaliseImageId
} from "@/lib/content-agent/field-utils";

import type {
    BlockValue,
    FieldPath,
    MediaItem
} from "@/types/content-agent";

type ImageFieldProps = {
    value: BlockValue;
    blockIndex: number;
    path: FieldPath;
    label: string;
    media: MediaItem[];

    onOpenPicker: (
        blockIndex: number,
        path: FieldPath,
        currentValue: BlockValue
    ) => void;

    onUpdate: (
        blockIndex: number,
        path: FieldPath,
        value: BlockValue
    ) => void;
};

export default function ImageField({
    value,
    blockIndex,
    path,
    label,
    media,
    onOpenPicker,
    onUpdate
}: ImageFieldProps) {
    const selectedId =
        normaliseImageId(
            value
        );

    const selectedMedia =
        media.find(
            (item) =>
                item.id ===
                selectedId
        );

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">
                {label}
            </label>

            {selectedMedia ? (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <img
                        src={
                            selectedMedia.thumbnailUrl
                        }
                        alt={
                            selectedMedia.alt ||
                            selectedMedia.title
                        }
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                            {
                                selectedMedia.title
                            }
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                            Attachment #{selectedMedia.id}
                        </p>

                        {selectedMedia.width &&
                            selectedMedia.height && (
                                <p className="mt-1 text-xs text-zinc-400">
                                    {
                                        selectedMedia.width
                                    }
                                    {" × "}
                                    {
                                        selectedMedia.height
                                    }
                                </p>
                            )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            onUpdate(
                                blockIndex,
                                path,
                                null
                            )
                        }
                        className="rounded-lg px-2 py-2 text-xs font-medium text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
                    <p className="text-sm text-zinc-500">
                        No image selected
                    </p>
                </div>
            )}

            <button
                type="button"
                onClick={() =>
                    onOpenPicker(
                        blockIndex,
                        path,
                        value
                    )
                }
                className="mt-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
                Choose image
            </button>
        </div>
    );
}