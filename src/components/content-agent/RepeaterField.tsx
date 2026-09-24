import type {
    ReactNode
} from "react";

import {
    formatLabel
} from "@/lib/content-agent/field-utils";

import type {
    AcfField,
    BlockValue,
    FieldPath
} from "@/types/content-agent";

type RepeaterFieldProps = {
    value: BlockValue[];
    field?: AcfField;
    blockIndex: number;
    path: FieldPath;
    label: string;

    onRemoveRow: (
        blockIndex: number,
        path: FieldPath,
        rowIndex: number
    ) => void;

    onUpdate: (
        blockIndex: number,
        path: FieldPath,
        value: BlockValue
    ) => void;

    renderValue: (
        value: BlockValue,
        field: AcfField | undefined,
        blockIndex: number,
        path: FieldPath,
        label: string
    ) => ReactNode;
};

export default function RepeaterField({
    value,
    field,
    blockIndex,
    path,
    label,
    onRemoveRow,
    onUpdate,
    renderValue
}: RepeaterFieldProps) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold">
                {
                    field?.label ||
                    formatLabel(
                        label
                    )
                }
            </h3>

            {value.length === 0 && (
                <p className="text-sm text-zinc-500">
                    No rows returned.
                </p>
            )}

            {value.map(
                (
                    row,
                    rowIndex
                ) => {
                    const rowObject =
                        row &&
                        typeof row ===
                            "object" &&
                        !Array.isArray(
                            row
                        )
                            ? row as Record<
                                  string,
                                  BlockValue
                              >
                            : null;

                    return (
                        <div
                            key={`${path.join(".")}-${rowIndex}`}
                            className="space-y-4 rounded-lg border border-zinc-700 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">
                                    Row{" "}
                                    {rowIndex +
                                        1}
                                </h4>

                                <button
                                    type="button"
                                    onClick={() =>
                                        onRemoveRow(
                                            blockIndex,
                                            path,
                                            rowIndex
                                        )
                                    }
                                    className="text-sm text-red-400"
                                >
                                    Remove
                                </button>
                            </div>

                            {rowObject ? (
                                field?.subFields?.length ? (
                                    field.subFields.map(
                                        (
                                            subField
                                        ) => {
                                            const rowValue =
                                                rowObject[
                                                    subField.name
                                                ] ??
                                                null;

                                            return (
                                                <div
                                                    key={`${path.join(".")}-${rowIndex}-${subField.name}`}
                                                >
                                                    {renderValue(
                                                        rowValue,
                                                        subField,
                                                        blockIndex,
                                                        [
                                                            ...path,
                                                            rowIndex,
                                                            subField.name
                                                        ],
                                                        subField.name
                                                    )}
                                                </div>
                                            );
                                        }
                                    )
                                ) : (
                                    Object.entries(
                                        rowObject
                                    ).map(
                                        ([
                                            rowKey,
                                            rowValue
                                        ]) => (
                                            <div
                                                key={`${path.join(".")}-${rowIndex}-${rowKey}`}
                                            >
                                                {renderValue(
                                                    rowValue,
                                                    undefined,
                                                    blockIndex,
                                                    [
                                                        ...path,
                                                        rowIndex,
                                                        rowKey
                                                    ],
                                                    rowKey
                                                )}
                                            </div>
                                        )
                                    )
                                )
                            ) : (
                                <input
                                    type="text"
                                    value={
                                        row ===
                                        null
                                            ? ""
                                            : String(
                                                  row
                                              )
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        onUpdate(
                                            blockIndex,
                                            [
                                                ...path,
                                                rowIndex
                                            ],
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border p-3"
                                />
                            )}
                        </div>
                    );
                }
            )}
        </div>
    );
}