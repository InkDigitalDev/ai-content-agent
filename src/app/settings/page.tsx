import AppShell from "@/components/content-agent/AppShell";
import SettingsForm from "@/components/content-agent/SettingsForm";

export default function SettingsPage() {
    return (
        <AppShell
            header={
                <div>
                    <h1 className="text-2xl font-bold">
                        Settings
                    </h1>

                    <p className="mt-1 text-sm text-zinc-500">
                        Manage the WordPress site connected to the Content Agent
                    </p>
                </div>
            }
            content={
                <div className="mx-auto max-w-4xl">
                    <SettingsForm />
                </div>
            }
        />
    );
}