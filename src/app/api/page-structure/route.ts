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

export async function GET(request: Request) {
    try {
        const {
            searchParams
        } =
            new URL(
                request.url
            );

        const pageId =
            Number(
                searchParams.get(
                    "pageId"
                )
            );

        if (!pageId) {
            return Response.json(
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

        const config =
            await getWordPressConfig();

        const [
            pageResponse,
            availableSchemas
        ] =
            await Promise.all([
                fetch(
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
                ),
                getWordPressBlockSchema()
            ]);

        if (!pageResponse.ok) {
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
            page.content?.raw ?? "";

        const blockRegex =
            /<!-- wp:(inkwell\/[a-zA-Z0-9-_]+)(?:\s+(\{[\s\S]*?\}))?\s*\/-->/g;

        const blocks:
            PageBlock[] = [];

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
            const blockName =
                match[1];

            let data:
                Record<
                    string,
                    unknown
                > = {};

            if (match[2]) {
                try {
                    const parsed =
                        JSON.parse(
                            match[2]
                        );

                    if (
                        parsed &&
                        typeof parsed ===
                            "object" &&
                        "data" in parsed &&
                        parsed.data &&
                        typeof parsed.data ===
                            "object"
                    ) {
                        data =
                            parsed.data as Record<
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
                    availableSchemas[
                        blockName
                    ] ?? null
            });

            position++;
        }

        return Response.json({
            success: true,
            page: {
                id:
                    page.id,
                title:
                    page.title?.raw ||
                    page.title?.rendered ||
                    "",
                slug:
                    page.slug
            },
            blocks
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