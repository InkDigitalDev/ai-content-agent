import type {
    ImagePickerTarget,
    MediaItem
} from "@/types/content-agent";

type ImagePickerModalProps = {
    target: ImagePickerTarget;
    media: MediaItem[];
    loading: boolean;
    error: string;
    onSelect: (
        mediaId: number
    ) => void;
    onClose: () => void;
};

export default function ImagePickerModal({
    target,
    media,
    loading,
    error,
    onSelect,
    onClose
}: ImagePickerModalProps) {
    if (!target) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
            <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-700 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-700 p-5">
                    <div>
                        <h2 className="text-xl font-bold">
                            Choose image
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            WordPress Media Library
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
                    >
                        Close
                    </button>
                </div>

                <div className="overflow-y-auto p-5">
                    {loading && (
                        <p className="text-zinc-500">
                            Loading Media Library...
                        </p>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
                            {error}
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        media.length ===
                            0 && (
                            <p className="text-zinc-500">
                                No images found.
                            </p>
                        )}

                    {!loading &&
                        !error &&
                        media.length >
                            0 && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {media.map(
                                    (
                                        item
                                    ) => {
                                        const isSelected =
                                            target.selectedId ===
                                            item.id;

                                        return (
                                            <button
                                                key={
                                                    item.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    onSelect(
                                                        item.id
                                                    )
                                                }
                                                className={`overflow-hidden rounded-lg border p-2 text-left ${
                                                    isSelected
                                                        ? "border-white"
                                                        : "border-zinc-700"
                                                }`}
                                            >
                                                <img
                                                    src={
                                                        item.thumbnailUrl
                                                    }
                                                    alt={
                                                        item.alt ||
                                                        item.title
                                                    }
                                                    className="aspect-square w-full rounded object-cover"
                                                />

                                                <p className="mt-2 truncate text-sm font-medium">
                                                    {
                                                        item.title
                                                    }
                                                </p>

                                                <p className="text-xs text-zinc-500">
                                                    ID{" "}
                                                    {
                                                        item.id
                                                    }
                                                </p>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}