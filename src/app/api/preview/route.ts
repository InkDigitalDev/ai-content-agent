import {
    getWordPressAuthHeader,
    getWordPressConfig
} from "@/lib/wordpress-config";

type PreviewRequest = {
    blockName: string;
    fields: Record<string, unknown>;
};

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json() as PreviewRequest;

        const {
            blockName,
            fields
        } =
            body;

        if (
            !blockName ||
            !blockName.startsWith(
                "inkwell/"
            )
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        "A valid Inkwell blockName is required"
                },
                {
                    status: 400
                }
            );
        }

        if (
            !fields ||
            typeof fields !==
                "object" ||
            Array.isArray(
                fields
            )
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        "fields are required"
                },
                {
                    status: 400
                }
            );
        }

        const config =
            await getWordPressConfig();

        const response =
            await fetch(
                `${config.url}/wp-json/inkwell/v1/preview`,
                {
                    method:
                        "POST",
                    headers: {
                        Authorization:
                            getWordPressAuthHeader(
                                config
                            ),
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            blockName,
                            fields
                        }),
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            const error =
                await response.text();

            return Response.json(
                {
                    success: false,
                    error:
                        error ||
                        "WordPress preview failed"
                },
                {
                    status:
                        response.status
                }
            );
        }

        const data =
            await response.json();

        if (
            !data.success ||
            typeof data.html !==
                "string"
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        data.error ||
                        "WordPress returned an invalid preview response"
                },
                {
                    status: 500
                }
            );
        }

        return Response.json({
            success: true,
            html:
                data.html
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