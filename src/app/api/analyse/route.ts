import {
    NextRequest,
    NextResponse
} from "next/server";

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

type PageBlock = {
    instanceId: string;
    blockName: string;
    position: number;
    data: Record<string, unknown>;
    schema: BlockSchema | null;
};

type AiBlockResult = {
    instanceId: string;
    blockName: string;
    fields: Record<string, unknown>;
};

type AnalyseRequest = {
    content?: string;
    pageId?: number;
    instanceIds?: string[];
};

type FailedBlock = {
    instanceId: string;
    blockName: string;
    reason: string;
};

type ModelAttemptResult =
    | {
        success: true;
        block: AiBlockResult;
    }
    | {
        success: false;
        reason: string;
        detail?: string;
    };

type AnalyseBlockResult =
    | {
        success: true;
        block: AiBlockResult;
    }
    | {
        success: false;
        reason: string;
    };

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const MODEL =
    "openai/gpt-oss-20b:free";

const FALLBACK_MODELS = [
    "nvidia/nemotron-3.5-lightning:free",
    "openrouter/free"
];

const REQUEST_TIMEOUT =
    90_000;

const BLOCK_DELAY =
    1_500;

const RETRY_DELAY =
    2_500;

const BLOCK_CONCURRENCY =
    2;

function sleep(
    milliseconds: number
) {
    return new Promise<void>(
        (resolve) => {
            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}

async function getPageBlocks(
    pageId: number
): Promise<PageBlock[]> {
    const config =
        await getWordPressConfig();

    const response =
        await fetch(
            `${config.url}/wp-json/wp/v2/pages/${pageId}?context=edit`,
            {
                headers: {
                    Authorization:
                        getWordPressAuthHeader(
                            config
                        )
                },
                cache:
                    "no-store"
            }
        );

    if (!response.ok) {
        throw new Error(
            "Could not load WordPress page"
        );
    }

    const page =
        await response.json();

    const rawContent =
        page?.content?.raw;

    if (
        typeof rawContent !==
        "string"
    ) {
        throw new Error(
            "WordPress page does not contain editable raw content"
        );
    }

    const schemas =
        await getWordPressBlockSchema();

    const blocks:
        PageBlock[] = [];

    const blockRegex =
        /<!-- wp:(inkwell\/[a-zA-Z0-9-_]+)(?:\s+(\{[\s\S]*?\}))?\s*\/-->/g;

    let match:
        RegExpExecArray | null;

    let position = 0;

    while (
        (
            match =
                blockRegex.exec(
                    rawContent
                )
        ) !== null
    ) {
        const blockName =
            match[1];

        let data:
            Record<string, unknown> = {};

        if (match[2]) {
            try {
                const attributes =
                    JSON.parse(
                        match[2]
                    ) as Record<
                        string,
                        unknown
                    >;

                if (
                    attributes.data &&
                    typeof attributes.data ===
                        "object" &&
                    !Array.isArray(
                        attributes.data
                    )
                ) {
                    data =
                        attributes.data as Record<
                            string,
                            unknown
                        >;
                }
            } catch {
                data = {};
            }
        }

        blocks.push({
            instanceId:
                `block-${position}`,
            blockName,
            position,
            data,
            schema:
                schemas[
                    blockName
                ] ?? null
        });

        position++;
    }

    return blocks;
}

function stripCodeFence(
    value: string
) {
    return value
        .replace(
            /^```(?:json)?\s*/i,
            ""
        )
        .replace(
            /\s*```$/i,
            ""
        )
        .trim();
}

function extractJsonObject(
    value: string
) {
    const stripped =
        stripCodeFence(
            value
        );

    const firstBrace =
        stripped.indexOf(
            "{"
        );

    const lastBrace =
        stripped.lastIndexOf(
            "}"
        );

    if (
        firstBrace === -1 ||
        lastBrace === -1 ||
        lastBrace <
            firstBrace
    ) {
        return null;
    }

    return stripped.slice(
        firstBrace,
        lastBrace + 1
    );
}

function sanitiseLinks(
    value: unknown,
    allowNewTab: boolean
): unknown {
    if (
        Array.isArray(value)
    ) {
        return value.map(
            (item) =>
                sanitiseLinks(
                    item,
                    allowNewTab
                )
        );
    }

    if (
        !value ||
        typeof value !==
            "object"
    ) {
        return value;
    }

    const objectValue = {
        ...(value as Record<
            string,
            unknown
        >)
    };

    if (
        "target" in
        objectValue
    ) {
        const target =
            objectValue.target;

        objectValue.target =
            allowNewTab &&
            target === "_blank"
                ? "_blank"
                : "";
    }

    for (
        const [
            key,
            childValue
        ]
        of Object.entries(
            objectValue
        )
    ) {
        objectValue[key] =
            sanitiseLinks(
                childValue,
                allowNewTab
            );
    }

    return objectValue;
}

function sourceRequestsNewTab(
    content: string
) {
    return /new\s+tab|new\s+window|target\s*=\s*["']?_blank/i.test(
        content
    );
}

function validateBlockResult(
    value: unknown,
    expectedBlock: PageBlock,
    sourceContent: string
): ModelAttemptResult {
    if (
        !value ||
        typeof value !==
            "object" ||
        Array.isArray(value)
    ) {
        return {
            success: false,
            reason:
                "INVALID_STRUCTURE"
        };
    }

    const objectValue =
        value as Record<
            string,
            unknown
        >;

    let blockValue:
        unknown;

    if (
        objectValue.block &&
        typeof objectValue.block ===
            "object"
    ) {
        blockValue =
            objectValue.block;
    } else if (
        Array.isArray(
            objectValue.blocks
        ) &&
        objectValue.blocks
            .length === 1
    ) {
        blockValue =
            objectValue.blocks[0];
    } else {
        blockValue =
            objectValue;
    }

    if (
        !blockValue ||
        typeof blockValue !==
            "object" ||
        Array.isArray(blockValue)
    ) {
        return {
            success: false,
            reason:
                "INVALID_STRUCTURE"
        };
    }

    const block =
        blockValue as Record<
            string,
            unknown
        >;

    if (
        block.instanceId !==
        expectedBlock.instanceId
    ) {
        return {
            success: false,
            reason:
                "INVALID_INSTANCE",
            detail:
                `Expected ${expectedBlock.instanceId}, received ${String(block.instanceId)}`
        };
    }

    if (
        block.blockName !==
        expectedBlock.blockName
    ) {
        return {
            success: false,
            reason:
                "INVALID_BLOCK",
            detail:
                `Expected ${expectedBlock.blockName}, received ${String(block.blockName)}`
        };
    }

    if (
        !block.fields ||
        typeof block.fields !==
            "object" ||
        Array.isArray(
            block.fields
        )
    ) {
        return {
            success: false,
            reason:
                "INVALID_FIELDS"
        };
    }

    const allowNewTab =
        sourceRequestsNewTab(
            sourceContent
        );

    const fields =
        sanitiseLinks(
            block.fields,
            allowNewTab
        );

    return {
        success: true,
        block: {
            instanceId:
                expectedBlock.instanceId,
            blockName:
                expectedBlock.blockName,
            fields:
                fields as Record<
                    string,
                    unknown
                >
        }
    };
}

function buildSystemPrompt(
    block: PageBlock
) {
    return `
You are mapping supplied client content into exactly ONE existing WordPress ACF block.

You must return valid JSON only.

Do not include markdown.
Do not include code fences.
Do not include commentary.
Do not explain your answer.

The block you are mapping is fixed.

INSTANCE ID:
${block.instanceId}

BLOCK NAME:
${block.blockName}

ACF SCHEMA:
${JSON.stringify(
    block.schema,
    null,
    2
)}

CURRENT BLOCK DATA:
${JSON.stringify(
    block.data,
    null,
    2
)}

RULES:

1. Return content for this block only.

2. You MUST return the exact instanceId:
"${block.instanceId}"

3. You MUST return the exact blockName:
"${block.blockName}"

4. Only use fields that exist in the supplied ACF schema.

5. Do not invent facts, claims, URLs, statistics, testimonials, people, locations or other content that is not supported by the supplied client content.

6. Never use ACF schema metadata such as field keys, field names, labels, field types, required flags or schema property names as actual content values.

7. The ACF schema describes the destination structure only. Actual field values must come from the supplied client content.

8. Do not invent new WordPress blocks or fields.

9. Ignore image fields. Do not generate image IDs or image URLs. Images are handled separately by the application.

10. Preserve the structure required by ACF fields.

11. For repeater fields, return arrays of row objects using only valid repeater subfields.

12. For link fields, use:
{
    "title": "",
    "url": "",
    "target": ""
}

13. Only use "_blank" for a link target when the supplied client content explicitly asks for a new tab or new window. Otherwise target must be an empty string.

14. If the supplied content does not contain suitable content for an optional field, omit that field rather than inventing something.

15. Keep copy natural and suitable for a real website.

16. Never copy values from the ACF schema itself into output fields.

17. If a repeater contains fields such as "stat", "copy", "title", "text", "question", "answer", "name" or similar content fields, populate those values only from semantically matching client content.

18. For short statistic-and-description pairs such as:
"600+" + "Students every summer"
map the numeric or short value to the most suitable statistic/value field and the descriptive text to the most suitable copy/text field.

MULTIPLE FIELD MAPPING RULES:

- When the source contains multiple distinct values that are compatible with multiple fields of the same semantic type, map them across the available fields in source order.
- Use the live schema as the source of truth for what fields exist.
- Do not require the source to explicitly name the destination field.
- Do not discard additional valid values when compatible fields remain available.
- For link fields specifically, treat a text label followed by a URL as one link candidate.
- Map multiple link candidates to multiple compatible link fields in source order.
- Preserve the supplied text and URL.

REPEATER FIELD SELECTION RULES:

- When multiple repeater fields exist in the same block, choose the destination repeater by semantic meaning from the field name, field label and subfield labels, not only by structural similarity.
- Do not map structured source items into the first compatible repeater if another repeater is a better semantic match.
- Treat names and labels in the live ACF schema as semantic guidance for the intended content type.
- Value-and-label pairs such as "500+" + "Students every summer" should prefer repeater fields whose names or labels indicate USPs, statistics, metrics, facts or key figures.
- Question-and-answer pairs should prefer FAQ or accordion repeaters.
- Quote-and-person pairs should prefer testimonial or review repeaters.
- Step-and-description pairs should prefer process, steps or timeline repeaters.
- Card-style title-and-copy groups should prefer card, grid, feature or item repeaters.
- Only fall back to structural similarity when no repeater has a stronger semantic match.

RETURN EXACTLY THIS SHAPE:

{
    "block": {
        "instanceId": "${block.instanceId}",
        "blockName": "${block.blockName}",
        "fields": {}
    }
}
`.trim();
}

async function callOpenRouter(
    block: PageBlock,
    sourceContent: string
): Promise<ModelAttemptResult> {
    const apiKey =
        process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            reason:
                "MISSING_API_KEY"
        };
    }

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => {
                controller.abort();
            },
            REQUEST_TIMEOUT
        );

    try {
        const response =
            await fetch(
                OPENROUTER_URL,
                {
                    method:
                        "POST",
                    headers: {
                        Authorization:
                            `Bearer ${apiKey}`,
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            model:
                                MODEL,
                            models:
                                FALLBACK_MODELS,
                            messages: [
                                {
                                    role:
                                        "system",
                                    content:
                                        buildSystemPrompt(
                                            block
                                        )
                                },
                                {
                                    role:
                                        "user",
                                    content:
                                        sourceContent
                                }
                            ],
                            response_format: {
                                type:
                                    "json_object"
                            },
                            temperature:
                                0.1
                        }),
                    signal:
                        controller.signal
                }
            );

        if (!response.ok) {
            const errorText =
                await response.text();

            console.error(
                `OpenRouter HTTP error for ${block.instanceId}:`,
                response.status,
                errorText
            );

            return {
                success: false,
                reason:
                    `HTTP_${response.status}`,
                detail:
                    errorText
            };
        }

        const data =
            await response.json();

        const content =
            data?.choices?.[0]
                ?.message
                ?.content;

        if (
            typeof content !==
                "string" ||
            !content.trim()
        ) {
            console.warn(
                `OpenRouter returned no usable content for ${block.instanceId}`,
                data
            );

            return {
                success: false,
                reason:
                    "NO_RESULT"
            };
        }

        const jsonText =
            extractJsonObject(
                content
            );

        if (!jsonText) {
            console.warn(
                `Could not extract JSON for ${block.instanceId}:`,
                content
            );

            return {
                success: false,
                reason:
                    "INVALID_JSON",
                detail:
                    content.slice(
                        0,
                        500
                    )
            };
        }

        let parsed:
            unknown;

        try {
            parsed =
                JSON.parse(
                    jsonText
                );
        } catch (error) {
            console.warn(
                `Malformed JSON for ${block.instanceId}:`,
                jsonText,
                error
            );

            return {
                success: false,
                reason:
                    "INVALID_JSON",
                detail:
                    jsonText.slice(
                        0,
                        500
                    )
            };
        }

        return validateBlockResult(
            parsed,
            block,
            sourceContent
        );
    } catch (error) {
        if (
            error instanceof Error &&
            error.name ===
                "AbortError"
        ) {
            console.error(
                `OpenRouter timed out for ${block.instanceId}`
            );

            return {
                success: false,
                reason:
                    "TIMEOUT"
            };
        }

        console.error(
            `OpenRouter request crashed for ${block.instanceId}:`,
            error
        );

        return {
            success: false,
            reason:
                "REQUEST_FAILED",
            detail:
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    )
        };
    } finally {
        clearTimeout(
            timeout
        );
    }
}

async function analyseBlock(
    block: PageBlock,
    sourceContent: string
): Promise<AnalyseBlockResult> {
    console.log(
        `Analysing ${block.instanceId} (${block.blockName})`
    );

    const firstAttempt =
        await callOpenRouter(
            block,
            sourceContent
        );

    if (firstAttempt.success) {
        console.log(
            `${block.instanceId} succeeded on first attempt`
        );

        return {
            success: true,
            block:
                firstAttempt.block
        };
    }

    console.warn(
        `${block.instanceId} first attempt failed:`,
        firstAttempt.reason,
        firstAttempt.detail ??
            ""
    );

    if (
        firstAttempt.reason ===
        "HTTP_429"
    ) {
        console.warn(
            `${block.instanceId} was rate limited. Skipping immediate retry.`
        );

        return {
            success: false,
            reason:
                firstAttempt.reason
        };
    }

    await sleep(
        RETRY_DELAY
    );

    console.log(
        `Retrying ${block.instanceId}`
    );

    const secondAttempt =
        await callOpenRouter(
            block,
            sourceContent
        );

    if (secondAttempt.success) {
        console.log(
            `${block.instanceId} succeeded on retry`
        );

        return {
            success: true,
            block:
                secondAttempt.block
        };
    }

    console.error(
        `${block.instanceId} failed twice:`,
        secondAttempt.reason,
        secondAttempt.detail ??
            ""
    );

    return {
        success: false,
        reason:
            secondAttempt.reason
    };
}

export async function POST(
    request: NextRequest
) {
    let body:
        AnalyseRequest;

    try {
        body =
            await request.json();
    } catch {
        return NextResponse.json(
            {
                success: false,
                error:
                    "Invalid request body"
            },
            {
                status: 400
            }
        );
    }

    const {
        content,
        pageId,
        instanceIds
    } = body;

    if (
        typeof content !==
            "string" ||
        !content.trim()
    ) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "Content is required"
            },
            {
                status: 400
            }
        );
    }

    if (
        typeof pageId !==
            "number"
    ) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "pageId is required"
            },
            {
                status: 400
            }
        );
    }

    if (
        !Array.isArray(
            instanceIds
        ) ||
        instanceIds.length ===
            0
    ) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "At least one component must be selected"
            },
            {
                status: 400
            }
        );
    }

    try {
        const pageBlocks =
            await getPageBlocks(
                pageId
            );

        const selectedBlocks =
            instanceIds.map(
                (instanceId) =>
                    pageBlocks.find(
                        (block) =>
                            block.instanceId ===
                            instanceId
                    )
            );

        if (
            selectedBlocks.some(
                (block) =>
                    !block
            )
        ) {
            const missingInstanceIds =
                instanceIds.filter(
                    (instanceId) =>
                        !pageBlocks.some(
                            (block) =>
                                block.instanceId ===
                                instanceId
                        )
                );

            return NextResponse.json(
                {
                    success: false,
                    error:
                        `Could not find selected block instances: ${missingInstanceIds.join(", ")}`
                },
                {
                    status: 400
                }
            );
        }

        const validBlocks =
            selectedBlocks as PageBlock[];

        for (
            const block
            of validBlocks
        ) {
            if (!block.schema) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            `No schema found for ${block.instanceId} (${block.blockName})`
                    },
                    {
                        status: 400
                    }
                );
            }
        }

        const analysedBlocks:
            AiBlockResult[] = [];

        const failedBlocks:
            FailedBlock[] = [];

        for (
            let startIndex = 0;
            startIndex <
            validBlocks.length;
            startIndex +=
            BLOCK_CONCURRENCY
        ) {
            if (
                startIndex > 0
            ) {
                console.log(
                    `Waiting ${BLOCK_DELAY}ms before starting next block batch`
                );

                await sleep(
                    BLOCK_DELAY
                );
            }

            const batch =
                validBlocks.slice(
                    startIndex,
                    startIndex +
                        BLOCK_CONCURRENCY
                );

            console.log(
                `Starting batch: ${batch
                    .map(
                        (block) =>
                            block.instanceId
                    )
                    .join(", ")}`
            );

            const batchResults =
                await Promise.all(
                    batch.map(
                        (block) =>
                            analyseBlock(
                                block,
                                content
                            )
                    )
                );

            batch.forEach(
                (
                    block,
                    batchIndex
                ) => {
                    const blockResult =
                        batchResults[
                            batchIndex
                        ];

                    if (
                        blockResult.success
                    ) {
                        analysedBlocks.push(
                            blockResult.block
                        );

                        return;
                    }

                    failedBlocks.push({
                        instanceId:
                            block.instanceId,
                        blockName:
                            block.blockName,
                        reason:
                            blockResult.reason
                    });
                }
            );
        }

        if (
            analysedBlocks.length ===
            0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "AI could not generate valid content for any of the selected components",
                    failedBlocks
                },
                {
                    status: 502
                }
            );
        }

        const result = {
            blocks:
                analysedBlocks
        };

        return NextResponse.json({
            success: true,

            result:
                JSON.stringify(
                    result
                ),

            partial:
                failedBlocks.length >
                0,

            failedBlocks
        });
    } catch (error) {
        console.error(
            "Analyse route failed:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Could not analyse content"
            },
            {
                status: 500
            }
        );
    }
}