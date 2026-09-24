import AppShell from "@/components/content-agent/AppShell";
import MediaLibrary from "@/components/content-agent/MediaLibrary";

export default function MediaPage() {
    return (
        <AppShell
            header={
                <div>
                    <h1 className="text-2xl font-bold">
                        Media Library
                    </h1>

                    <p className="mt-1 text-sm text-zinc-500">
                        Browse images from the connected WordPress website
                    </p>
                </div>
            }
            content={
                <MediaLibrary />
            }
        />
    );
}