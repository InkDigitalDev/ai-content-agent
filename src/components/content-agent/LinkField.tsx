import type {
    BlockFields,
    BlockValue,
    FieldPath
} from "@/types/content-agent";

type LinkFieldProps = {
    value: BlockValue;
    blockIndex: number;
    path: FieldPath;
    label: string;

    onUpdate: (
        blockIndex: number,
        path: FieldPath,
        value: BlockValue
    ) => void;
};

export default function LinkField({
    value,
    blockIndex,
    path,
    label,
    onUpdate
}: LinkFieldProps) {
    const linkValue: BlockFields =
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
            ? value
            : {};

    const title =
        typeof linkValue.title ===
        "string"
            ? linkValue.title
            : "";

    const url =
        typeof linkValue.url ===
        "string"
            ? linkValue.url
            : "";

    const target =
        typeof linkValue.target ===
        "string"
            ? linkValue.target
            : "";

    function updateLinkField(
        key: "title" | "url" | "target",
        fieldValue: string
    ) {
        onUpdate(
            blockIndex,
            path,
            {
                ...linkValue,
                [key]: fieldValue
            }
        );
    }

    return (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
            <p className="mb-4 text-sm font-semibold text-zinc-800">
                {label}
            </p>

            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Link text
                    </label>

                    <input
                        type="text"
                        value={title}
                        onChange={(event) =>
                            updateLinkField(
                                "title",
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        URL
                    </label>

                    <input
                        type="url"
                        value={url}
                        onChange={(event) =>
                            updateLinkField(
                                "url",
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700">
                    <input
                        type="checkbox"
                        checked={
                            target === "_blank"
                        }
                        onChange={(event) =>
                            updateLinkField(
                                "target",
                                event.target.checked
                                    ? "_blank"
                                    : ""
                            )
                        }
                        className="h-4 w-4 rounded border-zinc-300 accent-violet-600"
                    />

                    Open in new tab
                </label>
            </div>
        </div>
    );
}