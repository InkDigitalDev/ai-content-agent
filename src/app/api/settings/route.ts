import {
    NextRequest,
    NextResponse
} from "next/server";

import {
    getPublicWordPressConfig,
    getWordPressAuthHeader,
    getWordPressConfig,
    isEnvironmentManaged,
    saveWordPressConfig
} from "@/lib/wordpress-config";

type SettingsRequest = {
    siteName?: string;
    url?: string;
    username?: string;
    applicationPassword?: string;
};

export async function GET() {
    try {
        const config =
            await getWordPressConfig();

        return NextResponse.json({
            success: true,
            config:
                getPublicWordPressConfig(
                    config
                )
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Could not load settings"
            },
            {
                status: 500
            }
        );
    }
}

export async function POST(
    request: NextRequest
) {
    if (
        isEnvironmentManaged()
    ) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "Settings are managed through Vercel environment variables on this deployment."
            },
            {
                status: 405
            }
        );
    }

    let body:
        SettingsRequest;

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

    const current =
        await getWordPressConfig();

    const siteName =
        body.siteName?.trim() ??
        current.siteName;

    const url =
        body.url?.trim() ??
        current.url;

    const username =
        body.username?.trim() ??
        current.username;

    const applicationPassword =
        body.applicationPassword &&
        body.applicationPassword.trim() !== ""
            ? body.applicationPassword
            : current.applicationPassword;

    if (!siteName) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "Site name is required"
            },
            {
                status: 400
            }
        );
    }

    if (!url) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "WordPress URL is required"
            },
            {
                status: 400
            }
        );
    }

    if (!username) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "WordPress username is required"
            },
            {
                status: 400
            }
        );
    }

    if (!applicationPassword) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "Application password is required"
            },
            {
                status: 400
            }
        );
    }

    try {
        new URL(
            url
        );
    } catch {
        return NextResponse.json(
            {
                success: false,
                error:
                    "WordPress URL is invalid"
            },
            {
                status: 400
            }
        );
    }

    try {
        const saved =
            await saveWordPressConfig({
                siteName,
                url,
                username,
                applicationPassword
            });

        return NextResponse.json({
            success: true,
            config:
                getPublicWordPressConfig(
                    saved
                )
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Could not save settings"
            },
            {
                status: 500
            }
        );
    }
}

export async function PATCH(
    request: NextRequest
) {
    let body:
        SettingsRequest;

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

    const current =
        await getWordPressConfig();

    const environmentManaged =
        isEnvironmentManaged();

    const config =
        environmentManaged
            ? current
            : {
                siteName:
                    body.siteName?.trim() ||
                    current.siteName,

                url:
                    body.url?.trim() ||
                    current.url,

                username:
                    body.username?.trim() ||
                    current.username,

                applicationPassword:
                    body.applicationPassword &&
                    body.applicationPassword.trim() !== ""
                        ? body.applicationPassword
                        : current.applicationPassword
            };

    if (!config.url) {
        return NextResponse.json(
            {
                success: false,
                error:
                    "WordPress URL is not configured"
            },
            {
                status: 400
            }
        );
    }

    try {
        const auth =
            getWordPressAuthHeader(
                config
            );

        const response =
            await fetch(
                `${config.url}/wp-json/wp/v2/users/me?context=edit`,
                {
                    headers: {
                        Authorization:
                            auth
                    },
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            const text =
                await response.text();

            return NextResponse.json(
                {
                    success: false,
                    error:
                        `WordPress connection failed (${response.status})`,
                    detail:
                        text
                },
                {
                    status: 502
                }
            );
        }

        const user =
            await response.json();

        return NextResponse.json({
            success: true,
            connection: {
                siteName:
                    config.siteName,
                url:
                    config.url,
                username:
                    user?.name ??
                    user?.slug ??
                    config.username
            }
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Could not connect to WordPress"
            },
            {
                status: 500
            }
        );
    }
}