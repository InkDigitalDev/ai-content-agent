import {
    getWordPressAuthHeader,
    getWordPressConfig
} from "@/lib/wordpress-config";

export async function GET() {
    try {
        const config =
            await getWordPressConfig();

        const response =
            await fetch(
                `${config.url}/wp-json/wp/v2/pages?context=edit&per_page=100`,
                {
                    headers: {
                        Authorization:
                            getWordPressAuthHeader(
                                config
                            )
                    },
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            const error =
                await response.text();

            return Response.json(
                {
                    success: false,
                    status:
                        response.status,
                    error
                },
                {
                    status:
                        response.status
                }
            );
        }

        const pages =
            await response.json();

        return Response.json({
            success: true,
            pages: pages.map(
                (page: {
                    id: number;
                    slug: string;
                    title: {
                        raw?: string;
                        rendered?: string;
                    };
                }) => ({
                    id:
                        page.id,
                    slug:
                        page.slug,
                    title:
                        page.title.raw ||
                        page.title.rendered ||
                        page.slug
                })
            )
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