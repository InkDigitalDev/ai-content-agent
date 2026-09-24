export async function GET() {
    try {
        const username = process.env.WORDPRESS_USERNAME;
        const password = process.env.WORDPRESS_APP_PASSWORD;

        if (!username || !password) {
            return Response.json(
                {
                    success: false,
                    error: "WordPress credentials are missing"
                },
                {
                    status: 500
                }
            );
        }

        const auth = Buffer.from(`${username}:${password}`).toString("base64");

        const response = await fetch(
            "http://ai-boilerplate.local/wp-json/wp/v2/block-types?context=edit&per_page=100",
            {
                headers: {
                    Authorization: `Basic ${auth}`
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            const error = await response.text();

            return Response.json(
                {
                    success: false,
                    status: response.status,
                    error
                },
                {
                    status: response.status
                }
            );
        }

        const blocks = await response.json();

        const inkwellBlocks = blocks.filter(
            (block: { name?: string }) =>
                block.name?.startsWith("inkwell/")
        );

        return Response.json({
            success: true,
            blocks: inkwellBlocks
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