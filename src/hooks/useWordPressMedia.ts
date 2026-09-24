import {
    useEffect,
    useState
} from "react";

import type {
    MediaItem
} from "@/types/content-agent";

export function useWordPressMedia() {
    const [media, setMedia] =
        useState<MediaItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadMedia() {
            try {
                const response =
                    await fetch(
                        "/api/media"
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    setError(
                        data.error ||
                        "Could not load WordPress media"
                    );

                    return;
                }

                setMedia(
                    data.media ?? []
                );
            } catch {
                setError(
                    "Could not load WordPress media"
                );
            } finally {
                setLoading(false);
            }
        }

        loadMedia();
    }, []);

    return {
        media,
        loading,
        error
    };
}