import {
    getWordPressAuthHeader,
    getWordPressConfig
} from "@/lib/wordpress-config";

import {
    getWordPressBlockSchema
} from "@/lib/wordpress-schema";

type AcfField = {
    key: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    subFields?: AcfField[];
};

type BlockSchema = {
    title: string;
    fields: AcfField[];
};

type BlockUpdate = {
    instanceId: string;
    blockName: string;
    fields: Record<string, unknown>;
};

type PopulateRequest = {
    pageId: number;
    blocks: BlockUpdate[];
};

type GutenbergBlockMatch = {
    instanceId: string;
    blockName: string;
    start: number;
    end: number;
    json: string;
};

function getRepeaterRowCount(
    data: Record<string, unknown>,
    fieldName: string
) {
    const value =
        data[fieldName];

    if (
        typeof value ===
        "number"
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

    return 0;
}

function getExistingRepeaterRows(
    data: Record<string, unknown>,
    field: AcfField,
    prefix = ""
) {
    const storageName =
        `${prefix}${field.name}`;

    const rows:
        Record<
            string,
            unknown
        >[] = [];

    const rowCount =
        getRepeaterRowCount(
            data,
            storageName
        );

    const subFields =
        field.subFields ?? [];

    for (
        let rowIndex = 0;
        rowIndex < rowCount;
        rowIndex++
    ) {
        const row:
            Record<
                string,
                unknown
            > = {};

        for (
            const subField
            of subFields
        ) {
            const storageKey =
                `${storageName}_${rowIndex}_${subField.name}`;

            if (
                storageKey in data
            ) {
                row[
                    subField.name
                ] =
                    data[
                        storageKey
                    ];
            }
        }

        rows.push(
            row
        );
    }

    return rows;
}

function clearRepeaterData(
    data: Record<string, unknown>,
    storageName: string
) {
    const valuePrefix =
        `${storageName}_`;

    const metaPrefix =
        `_${storageName}_`;

    for (
        const key
        of Object.keys(
            data
        )
    ) {
        if (
            key.startsWith(
                valuePrefix
            ) ||
            key.startsWith(
                metaPrefix
            )
        ) {
            delete data[key];
        }
    }
}

function writeGroup(
    data: Record<string, unknown>,
    field: AcfField,
    value: unknown,
    prefix = ""
) {
    if (
        !value ||
        typeof value !==
            "object" ||
        Array.isArray(
            value
        )
    ) {
        return;
    }

    const storageName =
        `${prefix}${field.name}`;

    const suppliedGroup =
        value as Record<
            string,
            unknown
        >;

    /*
     * ACF groups inside Gutenberg block data are flattened.
     *
     * Example:
     *
     * ctas.primary_cta
     *
     * becomes:
     *
     * ctas_primary_cta
     * _ctas_primary_cta
     *
     * The group itself keeps its field-key metadata,
     * but should not be stored as a nested object.
     */
    delete data[
        storageName
    ];

    data[
        `_${storageName}`
    ] =
        field.key;

    const subFields =
        field.subFields ?? [];

    for (
        const subField
        of subFields
    ) {
        if (
            !(
                subField.name in
                suppliedGroup
            )
        ) {
            continue;
        }

        writeField(
            data,
            subField,
            suppliedGroup[
                subField.name
            ],
            `${storageName}_`
        );
    }
}

function writeRepeater(
    data: Record<string, unknown>,
    field: AcfField,
    value: unknown,
    prefix = ""
) {
    if (
        !Array.isArray(
            value
        )
    ) {
        return;
    }

    const storageName =
        `${prefix}${field.name}`;

    const existingRows =
        getExistingRepeaterRows(
            data,
            field,
            prefix
        );

    clearRepeaterData(
        data,
        storageName
    );

    data[
        storageName
    ] =
        value.length;

    data[
        `_${storageName}`
    ] =
        field.key;

    const subFields =
        field.subFields ?? [];

    value.forEach(
        (
            row,
            rowIndex
        ) => {
            if (
                !row ||
                typeof row !==
                    "object" ||
                Array.isArray(
                    row
                )
            ) {
                return;
            }

            const suppliedRow =
                row as Record<
                    string,
                    unknown
                >;

            const existingRow =
                existingRows[
                    rowIndex
                ] ?? {};

            for (
                const subField
                of subFields
            ) {
                const hasSuppliedValue =
                    subField.name in
                    suppliedRow;

                const hasExistingValue =
                    subField.name in
                    existingRow;

                if (
                    !hasSuppliedValue &&
                    !hasExistingValue
                ) {
                    continue;
                }

                const fieldValue =
                    hasSuppliedValue
                        ? suppliedRow[
                              subField.name
                          ]
                        : existingRow[
                              subField.name
                          ];

                writeField(
                    data,
                    subField,
                    fieldValue,
                    `${storageName}_${rowIndex}_`
                );
            }
        }
    );
}

function writeField(
    data: Record<string, unknown>,
    field: AcfField,
    value: unknown,
    prefix = ""
) {
    if (
        field.type ===
        "repeater"
    ) {
        writeRepeater(
            data,
            field,
            value,
            prefix
        );

        return;
    }

    if (
        field.type ===
        "group"
    ) {
        writeGroup(
            data,
            field,
            value,
            prefix
        );

        return;
    }

    const storageName =
        `${prefix}${field.name}`;

    data[
        storageName
    ] =
        value;

    data[
        `_${storageName}`
    ] =
        field.key;
}

function applyFieldsToBlock(
    existingData: Record<
        string,
        unknown
    >,
    suppliedFields: Record<
        string,
        unknown
    >,
    schema: BlockSchema
) {
    const updatedData:
        Record<
            string,
            unknown
        > = {
            ...existingData
        };

    for (
        const field
        of schema.fields
    ) {
        if (
            !(
                field.name in
                suppliedFields
            )
        ) {
            continue;
        }

        writeField(
            updatedData,
            field,
            suppliedFields[
                field.name
            ]
        );
    }

    return updatedData;
}

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json() as PopulateRequest;

        const {
            pageId,
            blocks
        } =
            body;

        if (
            !pageId ||
            !Array.isArray(
                blocks
            )
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        "pageId and blocks are required"
                },
                {
                    status: 400
                }
            );
        }

        const config =
            await getWordPressConfig();

        const auth =
            getWordPressAuthHeader(
                config
            );

        const pageResponse =
            await fetch(
                `${config.url}/wp-json/wp/v2/pages/${pageId}?context=edit`,
                {
                    headers: {
                        Authorization:
                            auth
                    },
                    cache:
                        "no-store"
                }
            );

        if (
            !pageResponse.ok
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        "Could not fetch WordPress page"
                },
                {
                    status:
                        pageResponse.status
                }
            );
        }

        const page =
            await pageResponse.json();

        const rawContent =
            page.content?.raw ??
            "";

        const availableSchemas =
            await getWordPressBlockSchema() as Record<
                string,
                BlockSchema
            >;

        const blockRegex =
            /<!-- wp:(inkwell\/[a-zA-Z0-9-_]+)(?:\s+(\{[\s\S]*?\}))?\s*\/-->/g;

        const pageBlocks:
            GutenbergBlockMatch[] = [];

        let match:
            RegExpExecArray | null;

        let position =
            0;

        while (
            (
                match =
                    blockRegex.exec(
                        rawContent
                    )
            ) !== null
        ) {
            pageBlocks.push({
                instanceId:
                    `block-${position}`,
                blockName:
                    match[1],
                start:
                    match.index,
                end:
                    match.index +
                    match[0].length,
                json:
                    match[2] ??
                    "{}"
            });

            position++;
        }

        if (
            !pageBlocks.length
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        "No Inkwell blocks found on this page"
                },
                {
                    status: 400
                }
            );
        }

        const replacements: {
            start: number;
            end: number;
            content: string;
        }[] = [];

        for (
            const block
            of blocks
        ) {
            if (
                !block.instanceId
            ) {
                return Response.json(
                    {
                        success: false,
                        error:
                            `Missing instanceId for ${block.blockName}`
                    },
                    {
                        status: 400
                    }
                );
            }

            const pageBlock =
                pageBlocks.find(
                    (
                        candidate
                    ) =>
                        candidate.instanceId ===
                        block.instanceId
                );

            if (!pageBlock) {
                return Response.json(
                    {
                        success: false,
                        error:
                            `Could not find ${block.instanceId} on the page`
                    },
                    {
                        status: 400
                    }
                );
            }

            if (
                pageBlock.blockName !==
                block.blockName
            ) {
                return Response.json(
                    {
                        success: false,
                        error:
                            `${block.instanceId} is ${pageBlock.blockName}, not ${block.blockName}`
                    },
                    {
                        status: 400
                    }
                );
            }

            const schema =
                availableSchemas[
                    block.blockName
                ];

            if (!schema) {
                return Response.json(
                    {
                        success: false,
                        error:
                            `No ACF schema found for ${block.blockName}`
                    },
                    {
                        status: 400
                    }
                );
            }

            let blockData:
                Record<
                    string,
                    unknown
                >;

            try {
                blockData =
                    JSON.parse(
                        pageBlock.json
                    );
            } catch {
                return Response.json(
                    {
                        success: false,
                        error:
                            `Could not parse ${block.instanceId}`
                    },
                    {
                        status: 500
                    }
                );
            }

            const existingData =
                blockData.data &&
                typeof blockData.data ===
                    "object" &&
                !Array.isArray(
                    blockData.data
                )
                    ? blockData.data as Record<
                          string,
                          unknown
                      >
                    : {};

            blockData.data =
                applyFieldsToBlock(
                    existingData,
                    block.fields,
                    schema
                );

            const replacement =
                `<!-- wp:${block.blockName} ` +
                `${JSON.stringify(blockData)} /-->`;

            replacements.push({
                start:
                    pageBlock.start,
                end:
                    pageBlock.end,
                content:
                    replacement
            });
        }

        replacements.sort(
            (
                a,
                b
            ) =>
                b.start -
                a.start
        );

        let updatedContent =
            rawContent;

        for (
            const replacement
            of replacements
        ) {
            updatedContent =
                updatedContent.slice(
                    0,
                    replacement.start
                ) +
                replacement.content +
                updatedContent.slice(
                    replacement.end
                );
        }

        const updateResponse =
            await fetch(
                `${config.url}/wp-json/wp/v2/pages/${pageId}`,
                {
                    method:
                        "POST",
                    headers: {
                        Authorization:
                            auth,
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            content:
                                updatedContent
                        })
                }
            );

        if (
            !updateResponse.ok
        ) {
            const updateError =
                await updateResponse.text();

            return Response.json(
                {
                    success: false,
                    error:
                        updateError ||
                        "WordPress update failed"
                },
                {
                    status:
                        updateResponse.status
                }
            );
        }

        return Response.json({
            success: true
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error"
            },
            {
                status: 500
            }
        );
    }
}