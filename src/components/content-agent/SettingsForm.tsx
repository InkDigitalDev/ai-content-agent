"use client";

import {
    useEffect,
    useState
} from "react";

type PublicWordPressConfig = {
    siteName: string;
    url: string;
    username: string;
    hasApplicationPassword: boolean;
    environmentManaged: boolean;
};

type ConnectionResult = {
    siteName: string;
    url: string;
    username: string;
};

export default function SettingsForm() {
    const [
        siteName,
        setSiteName
    ] =
        useState("");

    const [
        url,
        setUrl
    ] =
        useState("");

    const [
        username,
        setUsername
    ] =
        useState("");

    const [
        applicationPassword,
        setApplicationPassword
    ] =
        useState("");

    const [
        hasApplicationPassword,
        setHasApplicationPassword
    ] =
        useState(false);

    const [
        environmentManaged,
        setEnvironmentManaged
    ] =
        useState(false);

    const [
        loading,
        setLoading
    ] =
        useState(true);

    const [
        saving,
        setSaving
    ] =
        useState(false);

    const [
        testing,
        setTesting
    ] =
        useState(false);

    const [
        error,
        setError
    ] =
        useState("");

    const [
        success,
        setSuccess
    ] =
        useState("");

    const [
        connection,
        setConnection
    ] =
        useState<ConnectionResult | null>(
            null
        );

    useEffect(() => {
        async function loadSettings() {
            try {
                const response =
                    await fetch(
                        "/api/settings"
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    setError(
                        data.error ||
                        "Could not load settings"
                    );

                    return;
                }

                const config =
                    data.config as PublicWordPressConfig;

                setSiteName(
                    config.siteName ?? ""
                );

                setUrl(
                    config.url ?? ""
                );

                setUsername(
                    config.username ?? ""
                );

                setHasApplicationPassword(
                    Boolean(
                        config.hasApplicationPassword
                    )
                );

                setEnvironmentManaged(
                    Boolean(
                        config.environmentManaged
                    )
                );
            } catch {
                setError(
                    "Could not load settings"
                );
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    function getRequestBody() {
        return {
            siteName,
            url,
            username,
            applicationPassword
        };
    }

    async function testConnection() {
        setTesting(true);
        setError("");
        setSuccess("");
        setConnection(null);

        try {
            const response =
                await fetch(
                    "/api/settings",
                    {
                        method:
                            "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify(
                                getRequestBody()
                            )
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    data.error ||
                    "Could not connect to WordPress"
                );

                return;
            }

            setConnection(
                data.connection
            );

            setSuccess(
                "WordPress connection successful."
            );
        } catch {
            setError(
                "Could not connect to WordPress"
            );
        } finally {
            setTesting(false);
        }
    }

    async function saveSettings() {
        if (
            environmentManaged
        ) {
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response =
                await fetch(
                    "/api/settings",
                    {
                        method:
                            "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify(
                                getRequestBody()
                            )
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    data.error ||
                    "Could not save settings"
                );

                return;
            }

            setHasApplicationPassword(
                Boolean(
                    data.config
                        ?.hasApplicationPassword
                )
            );

            setApplicationPassword(
                ""
            );

            setSuccess(
                "Settings saved successfully."
            );
        } catch {
            setError(
                "Could not save settings"
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">
                    Loading settings...
                </p>
            </div>
        );
    }

    const inputClasses =
        environmentManaged
            ? "w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-600 outline-none"
            : "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        WordPress
                    </p>

                    <h2 className="mt-2 text-xl font-bold">
                        Site connection
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Configure which WordPress website the Content Agent reads from and populates.
                    </p>
                </div>

                {environmentManaged && (
                    <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-sm font-semibold text-violet-900">
                            Deployment configuration
                        </p>

                        <p className="mt-1 text-sm leading-6 text-violet-700">
                            This deployment is configured using Vercel environment variables. Update the WordPress connection in Vercel and redeploy the project to change these values.
                        </p>
                    </div>
                )}

                <div className="mt-6 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-800">
                            Site name
                        </label>

                        <input
                            type="text"
                            value={
                                siteName
                            }
                            onChange={(
                                event
                            ) =>
                                setSiteName(
                                    event
                                        .target
                                        .value
                                )
                            }
                            disabled={
                                environmentManaged
                            }
                            placeholder="Client website"
                            className={
                                inputClasses
                            }
                        />

                        <p className="mt-2 text-xs text-zinc-400">
                            A friendly label used inside the Content Agent.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-800">
                            WordPress URL
                        </label>

                        <input
                            type="url"
                            value={
                                url
                            }
                            onChange={(
                                event
                            ) =>
                                setUrl(
                                    event
                                        .target
                                        .value
                                )
                            }
                            disabled={
                                environmentManaged
                            }
                            placeholder="https://example.com"
                            className={
                                inputClasses
                            }
                        />

                        <p className="mt-2 text-xs text-zinc-400">
                            Use the site root, without a trailing slash.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-800">
                            WordPress username
                        </label>

                        <input
                            type="text"
                            value={
                                username
                            }
                            onChange={(
                                event
                            ) =>
                                setUsername(
                                    event
                                        .target
                                        .value
                                )
                            }
                            disabled={
                                environmentManaged
                            }
                            autoComplete="username"
                            className={
                                inputClasses
                            }
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-4">
                            <label className="text-sm font-semibold text-zinc-800">
                                Application password
                            </label>

                            {hasApplicationPassword && (
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                    Password configured
                                </span>
                            )}
                        </div>

                        {!environmentManaged && (
                            <>
                                <input
                                    type="password"
                                    value={
                                        applicationPassword
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setApplicationPassword(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder={
                                        hasApplicationPassword
                                            ? "Leave blank to keep current password"
                                            : "Enter WordPress application password"
                                    }
                                    autoComplete="new-password"
                                    className={
                                        inputClasses
                                    }
                                />

                                <p className="mt-2 text-xs text-zinc-400">
                                    The saved password is never returned to the browser.
                                </p>
                            </>
                        )}

                        {environmentManaged && (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-500">
                                {hasApplicationPassword
                                    ? "Application password configured in environment variables."
                                    : "Application password is not configured."}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                {connection && (
                    <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm font-semibold text-zinc-900">
                            Connected
                        </p>

                        <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-500">
                                    Site
                                </span>

                                <span className="font-medium text-zinc-900">
                                    {
                                        connection.siteName
                                    }
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-500">
                                    URL
                                </span>

                                <span className="truncate font-medium text-zinc-900">
                                    {
                                        connection.url
                                    }
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-500">
                                    WordPress user
                                </span>

                                <span className="font-medium text-zinc-900">
                                    {
                                        connection.username
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-200 pt-6">
                    <button
                        type="button"
                        onClick={
                            testConnection
                        }
                        disabled={
                            testing ||
                            !url ||
                            !username ||
                            !hasApplicationPassword
                        }
                        className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {testing
                            ? "Testing..."
                            : "Test connection"}
                    </button>

                    {!environmentManaged && (
                        <button
                            type="button"
                            onClick={
                                saveSettings
                            }
                            disabled={
                                saving ||
                                testing
                            }
                            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : "Save settings"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}