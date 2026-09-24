"use client";

import Link from "next/link";

import {
    usePathname
} from "next/navigation";

import {
    useEffect,
    useState
} from "react";

import type {
    ReactNode
} from "react";

type AppShellProps = {
    sidebar?: ReactNode;
    header?: ReactNode;

    leftColumn?: ReactNode;
    mainColumn?: ReactNode;
    rightColumn?: ReactNode;

    content?: ReactNode;
};

type NavigationItem = {
    label: string;
    href: string;
};

type ConnectionStatus = {
    loading: boolean;
    connected: boolean;
    siteName: string;
    url: string;
};

const navigationItems:
    NavigationItem[] = [
        {
            label:
                "Analyse Content",
            href:
                "/"
        },
        {
            label:
                "Media Library",
            href:
                "/media"
        },
        {
            label:
                "Settings",
            href:
                "/settings"
        }
    ];

export default function AppShell({
    sidebar,
    header,
    leftColumn,
    mainColumn,
    rightColumn,
    content
}: AppShellProps) {
    const pathname =
        usePathname();

    const [
        connection,
        setConnection
    ] =
        useState<ConnectionStatus>({
            loading: true,
            connected: false,
            siteName: "",
            url: ""
        });

    useEffect(() => {
        async function loadConnectionStatus() {
            try {
                const response =
                    await fetch(
                        "/api/settings/status",
                        {
                            cache:
                                "no-store"
                        }
                    );

                const data =
                    await response.json();

                setConnection({
                    loading: false,
                    connected:
                        Boolean(
                            data.connected
                        ),
                    siteName:
                        data.siteName ??
                        "",
                    url:
                        data.url ??
                        ""
                });
            } catch {
                setConnection({
                    loading: false,
                    connected: false,
                    siteName: "",
                    url: ""
                });
            }
        }

        loadConnectionStatus();
    }, [
        pathname
    ]);

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-950">
            <div className="min-h-screen">
                <aside className="flex w-full flex-col bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:min-h-screen lg:w-[220px]">
                    <div className="border-b border-white/10 px-5 py-6">
                        <Link
                            href="/"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 font-bold">
                                AI
                            </div>

                            <span className="font-semibold">
                                Content Agent
                            </span>
                        </Link>
                    </div>

                    <div className="flex-1 p-4">
                        {sidebar ?? (
                            <nav className="space-y-2">
                                {navigationItems.map(
                                    (
                                        item
                                    ) => {
                                        const isActive =
                                            item.href === "/"
                                                ? pathname ===
                                                  "/"
                                                : pathname.startsWith(
                                                      item.href
                                                  );

                                        return (
                                            <Link
                                                key={
                                                    item.href
                                                }
                                                href={
                                                    item.href
                                                }
                                                className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                                                    isActive
                                                        ? "bg-violet-500/15 text-violet-300"
                                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                            >
                                                {
                                                    item.label
                                                }
                                            </Link>
                                        );
                                    }
                                )}
                            </nav>
                        )}
                    </div>

                    <div className="border-t border-white/10 p-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start gap-2">
                                <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                        connection.loading
                                            ? "bg-amber-400"
                                            : connection.connected
                                              ? "bg-emerald-400"
                                              : "bg-red-400"
                                    }`}
                                />

                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white">
                                        {connection.loading
                                            ? "Checking WordPress"
                                            : connection.connected
                                              ? "WordPress connected"
                                              : "WordPress disconnected"}
                                    </p>

                                    {connection.siteName && (
                                        <p className="mt-1 truncate text-xs text-slate-400">
                                            {
                                                connection.siteName
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0 lg:pl-[220px]">
                    <header className="border-b border-zinc-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
                        {header ?? (
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Analyse Content
                                </h1>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Review and populate your WordPress content with AI
                                </p>
                            </div>
                        )}
                    </header>

                    <main className="p-4 sm:p-6">
                        {content ? (
                            content
                        ) : (
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(520px,1fr)_500px]">
                                <section className="min-w-0">
                                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                        {leftColumn}
                                    </div>
                                </section>

                                <section className="min-w-0">
                                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                        {mainColumn}
                                    </div>
                                </section>

                                <aside className="min-w-0 space-y-5 self-start xl:col-span-2 2xl:col-span-1 2xl:sticky 2xl:top-6">
                                    {
                                        rightColumn
                                    }
                                </aside>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}