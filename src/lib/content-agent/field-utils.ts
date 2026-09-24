import type {
    AcfField,
    AnalysisResult,
    BlockFields,
    FieldPath,
    PageStructureBlock
} from "@/types/content-agent";

export function formatBlockName(
    blockName: string
) {
    return blockName
        .replace(
            /^inkwell\//,
            ""
        )
        .split("-")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}

export function formatLabel(
    value: string
) {
    return value
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase()
        );
}

export function normaliseImageId(
    value: unknown
): number | null {
    if (
        typeof value ===
        "number" &&
        Number.isFinite(
            value
        )
    ) {
        return value;
    }

    if (
        typeof value ===
            "string" &&
        value.trim() !== "" &&
        !Number.isNaN(
            Number(value)
        )
    ) {
        return Number(
            value
        );
    }

    if (
        value &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
    ) {
        const objectValue =
            value as Record<
                string,
                unknown
            >;

        const id =
            objectValue.id ??
            objectValue.ID;

        if (
            typeof id ===
            "number"
        ) {
            return id;
        }

        if (
            typeof id ===
                "string" &&
            id.trim() !== "" &&
            !Number.isNaN(
                Number(id)
            )
        ) {
            return Number(
                id
            );
        }
    }

    return null;
}

export function setNestedValue(
    value: unknown,
    path: FieldPath,
    newValue: unknown
): unknown {
    if (
        path.length ===
        0
    ) {
        return newValue;
    }

    const [
        current,
        ...remaining
    ] =
        path;

    if (
        typeof current ===
        "number"
    ) {
        const arrayValue =
            Array.isArray(
                value
            )
                ? [
                      ...value
                  ]
                : [];

        arrayValue[
            current
        ] =
            setNestedValue(
                arrayValue[
                    current
                ],
                remaining,
                newValue
            );

        return arrayValue;
    }

    const objectValue =
        value &&
        typeof value ===
            "object" &&
        !Array.isArray(
            value
        )
            ? {
                  ...(value as Record<
                      string,
                      unknown
                  >)
              }
            : {};

    objectValue[
        current
    ] =
        setNestedValue(
            objectValue[
                current
            ],
            remaining,
            newValue
        );

    return objectValue;
}

function getExistingImageId(
    currentData: Record<
        string,
        unknown
    >,
    storageName: string
) {
    return normaliseImageId(
        currentData[
            storageName
        ]
    );
}

function mergeFieldImages(
    suppliedFields: BlockFields,
    schemaFields: AcfField[],
    currentData: Record<
        string,
        unknown
    >,
    prefix = ""
): BlockFields {
    const mergedFields: BlockFields = {
        ...suppliedFields
    };

    for (
        const field
        of schemaFields
    ) {
        const storageName =
            `${prefix}${field.name}`;

        if (
            field.type ===
            "image"
        ) {
            const suppliedImageId =
                normaliseImageId(
                    suppliedFields[
                        field.name
                    ]
                );

            if (
                suppliedImageId !==
                null
            ) {
                mergedFields[
                    field.name
                ] =
                    suppliedImageId;

                continue;
            }

            const existingImageId =
                getExistingImageId(
                    currentData,
                    storageName
                );

            if (
                existingImageId !==
                null
            ) {
                mergedFields[
                    field.name
                ] =
                    existingImageId;
            }

            continue;
        }

        if (
            field.type ===
            "group"
        ) {
            const suppliedGroup =
                suppliedFields[
                    field.name
                ];

            if (
                !suppliedGroup ||
                typeof suppliedGroup !==
                    "object" ||
                Array.isArray(
                    suppliedGroup
                )
            ) {
                continue;
            }

            mergedFields[
                field.name
            ] =
                mergeFieldImages(
                    suppliedGroup as BlockFields,
                    field.subFields ??
                        [],
                    currentData,
                    `${storageName}_`
                );

            continue;
        }

        if (
            field.type ===
            "repeater"
        ) {
            const suppliedRows =
                suppliedFields[
                    field.name
                ];

            if (
                !Array.isArray(
                    suppliedRows
                )
            ) {
                continue;
            }

            mergedFields[
                field.name
            ] =
                suppliedRows.map(
                    (
                        row,
                        rowIndex
                    ) => {
                        const rowFields =
                            row &&
                            typeof row ===
                                "object" &&
                            !Array.isArray(
                                row
                            )
                                ? row as BlockFields
                                : {};

                        return mergeFieldImages(
                            rowFields,
                            field.subFields ??
                                [],
                            currentData,
                            `${storageName}_${rowIndex}_`
                        );
                    }
                );

            continue;
        }
    }

    return mergedFields;
}

export function addSchemaImageFields(
    result: AnalysisResult,
    pageBlocks: PageStructureBlock[]
): AnalysisResult {
    return {
        ...result,

        blocks:
            result.blocks.map(
                (resultBlock) => {
                    const pageBlock =
                        pageBlocks.find(
                            (
                                candidate
                            ) =>
                                candidate.instanceId ===
                                resultBlock.instanceId
                        );

                    if (
                        !pageBlock ||
                        !pageBlock.schema
                    ) {
                        return resultBlock;
                    }

                    return {
                        ...resultBlock,

                        fields:
                            mergeFieldImages(
                                resultBlock.fields,
                                pageBlock.schema.fields,
                                pageBlock.data
                            )
                    };
                }
            )
    };
}