import {
    formatBlockName
} from "@/lib/content-agent/field-utils";

import type {
    PageStructureBlock
} from "@/types/content-agent";

type ComponentSelectorProps = {
    blocks: PageStructureBlock[];
    selectedInstanceIds: string[];
    loading: boolean;
    error: string;
    onToggle: (
        instanceId: string
    ) => void;
};

export default function ComponentSelector({
    blocks,
    selectedInstanceIds,
    loading,
    error,
    onToggle
}: ComponentSelectorProps) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-800">
                    Components
                </label>

                <span className="text-xs text-zinc-400">
                    {
                        selectedInstanceIds.length
                    } selected
                </span>
            </div>

            {loading && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500">
                    Loading components...
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading &&
                !error &&
                blocks.length === 0 && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500">
                        No Inkwell components found on this page.
                    </div>
                )}

            {!loading &&
                !error &&
                blocks.length > 0 && (
                    <div className="space-y-2">
                        {blocks.map(
                            (block) => {
                                const isSelected =
                                    selectedInstanceIds.includes(
                                        block.instanceId
                                    );

                                return (
                                    <button
                                        key={
                                            block.instanceId
                                        }
                                        type="button"
                                        onClick={() =>
                                            onToggle(
                                                block.instanceId
                                            )
                                        }
                                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                            isSelected
                                                ? "border-violet-300 bg-violet-50"
                                                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                                                isSelected
                                                    ? "border-violet-600 bg-violet-600 text-white"
                                                    : "border-zinc-300 bg-white text-transparent"
                                            }`}
                                        >
                                            ✓
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-zinc-900">
                                                    {formatBlockName(
                                                        block.blockName
                                                    )}
                                                </span>

                                                <span className="text-xs text-zinc-400">
                                                    {block.position +
                                                        1}
                                                </span>
                                            </div>

                                            <p className="mt-1 truncate text-xs text-zinc-400">
                                                {
                                                    block.instanceId
                                                }
                                            </p>
                                        </div>
                                    </button>
                                );
                            }
                        )}
                    </div>
                )}
        </div>
    );
}