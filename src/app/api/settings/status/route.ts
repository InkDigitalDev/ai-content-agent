import {
    getWordPressAuthHeader,
    getWordPressConfig
} from "@/lib/wordpress-config";

export async function GET() {
    try {
        const config =
            await getWordPressConfig();

        if (
            !config.url ||
            !config.username ||
            !config.applicationPassword
        ) {
            return Response.json({
                success: true,
                connected: false,
                siteName:
                    config.siteName,
                url:
                    config.url,
                error:
                    "WordPress connection is not fully configured"
            });
        }

        const response =
            await fetch(
                `${config.url}/wp-json/wp/v2/users/me?context=edit`,
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
            return Response.json({
                success: true,
                connected: false,
                siteName:
                    config.siteName,
                url:
                    config.url,
                error:
                    `WordPress returned ${response.status}`
            });
        }

        return Response.json({
            success: true,
            connected: true,
            siteName:
                config.siteName,
            url:
                config.url
        });
    } catch (error) {
        return Response.json({
            success: true,
            connected: false,
            siteName: "",
            url: "",
            error:
                error instanceof Error
                    ? error.message
                    : "Connection failed"
        });
    }
}