import type {
    ReactNode
} from "react";

import {
    formatLabel
} from "@/lib/content-agent/field-utils";

import type {
    AcfField,
    BlockValue,
    FieldPath,
    MediaItem
} from "@/types/content-agent";

import ImageField from "./ImageField";
import LinkField from "./LinkField";
import RepeaterField from "./RepeaterField";

type FieldRendererProps = {
    value: BlockValue;
    field?: AcfField;
    blockIndex: number;
    path: FieldPath;
    label: string;
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

export default function FieldRenderer({
    value,
    field,
    blockIndex,
    path,
    label,
    media,
    onUpdate,
    onRemoveRow,
    onOpenImagePicker
}: FieldRendererProps) {
    function renderValue(
        currentValue: BlockValue,
        currentField: AcfField | undefined,
        currentBlockIndex: number,
        currentPath: FieldPath,
        currentLabel: string
    ): ReactNode {
        const fieldType =
            currentField?.type;

        const displayLabel =
            currentField?.label ||
            formatLabel(
                currentLabel
            );

        const isImage =
            fieldType === "image" ||
            (
                !currentField &&
                (
                    currentLabel ===
                        "image" ||
                    currentLabel ===
                        "image_icon"
                )
            );

        if (isImage) {
            return (
                <ImageField
                    value={
                        currentValue
                    }
                    blockIndex={
                        currentBlockIndex
                    }
                    path={
                        currentPath
                    }
                    label={
                        displayLabel
                    }
                    media={
                        media
                    }
                    onOpenPicker={
                        onOpenImagePicker
                    }
                    onUpdate={
                        onUpdate
                    }
                />
            );
        }

        if (fieldType === "link") {
            return (
                <LinkField
                    value={
                        currentValue
                    }
                    blockIndex={
                        currentBlockIndex
                    }
                    path={
                        currentPath
                    }
                    label={
                        displayLabel
                    }
                    onUpdate={
                        onUpdate
                    }
                />
            );
        }

        if (
            fieldType ===
                "repeater" ||
            Array.isArray(
                currentValue
            )
        ) {
            if (
                !Array.isArray(
                    currentValue
                )
            ) {
                return (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-700">
                            {displayLabel}
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            Expected repeater rows but received an invalid value.
                        </p>
                    </div>
                );
            }

            return (
                <RepeaterField
                    value={
                        currentValue
                    }
                    field={
                        currentField
                    }
                    blockIndex={
                        currentBlockIndex
                    }
                    path={
                        currentPath
                    }
                    label={
                        currentLabel
                    }
                    onRemoveRow={
                        onRemoveRow
                    }
                    onUpdate={
                        onUpdate
                    }
                    renderValue={
                        renderValue
                    }
                />
            );
        }

        if (
            currentValue &&
            typeof currentValue ===
                "object"
        ) {
            return (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                    <p className="mb-4 text-sm font-semibold text-zinc-800">
                        {
                            displayLabel
                        }
                    </p>

                    <div className="space-y-4">
                        {Object.entries(
                            currentValue
                        ).map(
                            ([
                                childKey,
                                childValue
                            ]) => {
                                const childField =
                                    currentField?.subFields?.find(
                                        (
                                            schemaField
                                        ) =>
                                            schemaField.name ===
                                            childKey
                                    );

                                return (
                                    <div
                                        key={`${currentPath.join(".")}-${childKey}`}
                                    >
                                        {renderValue(
                                            childValue,
                                            childField,
                                            currentBlockIndex,
                                            [
                                                ...currentPath,
                                                childKey
                                            ],
                                            childKey
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            );
        }

        const displayValue =
            currentValue ===
                null ||
            currentValue ===
                undefined
                ? ""
                : String(
                    currentValue
                );

        const lowerLabel =
            currentLabel.toLowerCase();

        const useTextarea =
            fieldType ===
                "textarea" ||
            (
                !currentField &&
                (
                    lowerLabel.includes(
                        "copy"
                    ) ||
                    lowerLabel.includes(
                        "content"
                    ) ||
                    lowerLabel.includes(
                        "text"
                    ) ||
                    lowerLabel.includes(
                        "answer"
                    ) ||
                    lowerLabel.includes(
                        "quote"
                    )
                )
            );

        return (
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-800">
                        {
                            displayLabel
                        }
                    </label>

                    {currentField?.required && (
                        <span className="text-xs font-medium text-violet-500">
                            Required
                        </span>
                    )}
                </div>

                {useTextarea ? (
                    <textarea
                        value={
                            displayValue
                        }
                        onChange={(
                            event
                        ) =>
                            onUpdate(
                                currentBlockIndex,
                                currentPath,
                                event
                                    .target
                                    .value
                            )
                        }
                        className="min-h-32 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                ) : (
                    <input
                        type="text"
                        value={
                            displayValue
                        }
                        onChange={(
                            event
                        ) =>
                            onUpdate(
                                currentBlockIndex,
                                currentPath,
                                event
                                    .target
                                    .value
                            )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                )}
            </div>
        );
    }

    return renderValue(
        value,
        field,
        blockIndex,
        path,
        label
    );
}