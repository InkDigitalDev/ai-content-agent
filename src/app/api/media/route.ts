import {
    getWordPressAuthHeader,
    getWordPressConfig
} from "@/lib/wordpress-config";

type WordPressMediaItem = {
    id: number;
    slug: string;
    alt_text: string;
    mime_type: string;
    media_details?: {
        width?: number;
        height?: number;
        sizes?: Record<
            string,
            {
                source_url?: string;
                width?: number;
                height?: number;
            }
        >;
    };
    source_url: string;
    title?: {
        rendered?: string;
    };
};

type MediaItem = {
    id: number;
    title: string;
    alt: string;
    url: string;
    thumbnailUrl: string;
    width: number | null;
    height: number | null;
};

const PER_PAGE =
    100;

export async function GET() {
    try {
        const config =
            await getWordPressConfig();

        const auth =
            getWordPressAuthHeader(
                config
            );

        const firstResponse =
            await fetch(
                `${config.url}/wp-json/wp/v2/media?per_page=${PER_PAGE}&page=1&orderby=date&order=desc`,
                {
                    headers: {
                        Authorization:
                            auth
                    },
                    cache:
                        "no-store"
                }
            );

        if (!firstResponse.ok) {
            return Response.json(
                {
                    success: false,
                    error:
                        "Could not fetch WordPress media"
                },
                {
                    status:
                        firstResponse.status
                }
            );
        }

        const firstPage =
            await firstResponse.json() as WordPressMediaItem[];

        const totalPages =
            Number(
                firstResponse.headers.get(
                    "X-WP-TotalPages"
                ) ?? "1"
            );

        const remainingRequests:
            Promise<Response>[] = [];

        for (
            let page = 2;
            page <= totalPages;
            page++
        ) {
            remainingRequests.push(
                fetch(
                    `${config.url}/wp-json/wp/v2/media?per_page=${PER_PAGE}&page=${page}&orderby=date&order=desc`,
                    {
                        headers: {
                            Authorization:
                                auth
                        },
                        cache:
                            "no-store"
                    }
                )
            );
        }

        const remainingResponses =
            await Promise.all(
                remainingRequests
            );

        const wordpressMedia:
            WordPressMediaItem[] = [
                ...firstPage
            ];

        for (
            const response
            of remainingResponses
        ) {
            if (!response.ok) {
                continue;
            }

            const pageItems =
                await response.json() as WordPressMediaItem[];

            wordpressMedia.push(
                ...pageItems
            );
        }

        const media: MediaItem[] =
            wordpressMedia
                .filter(
                    (item) =>
                        typeof item.mime_type ===
                            "string" &&
                        item.mime_type.startsWith(
                            "image/"
                        )
                )
                .map(
                    (item) => {
                        const thumbnail =
                            item.media_details
                                ?.sizes
                                ?.thumbnail
                                ?.source_url;

                        const medium =
                            item.media_details
                                ?.sizes
                                ?.medium
                                ?.source_url;

                        return {
                            id:
                                item.id,

                            title:
                                item.title?.rendered ||
                                item.slug ||
                                `Image ${item.id}`,

                            alt:
                                item.alt_text ||
                                "",

                            url:
                                item.source_url,

                            thumbnailUrl:
                                thumbnail ||
                                medium ||
                                item.source_url,

                            width:
                                item.media_details
                                    ?.width ??
                                null,

                            height:
                                item.media_details
                                    ?.height ??
                                null
                        };
                    }
                );

        return Response.json({
            success: true,
            media
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