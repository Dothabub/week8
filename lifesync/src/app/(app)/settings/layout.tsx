import { PageHeader } from "@/components/ui/page-header";
import { SettingsTabs } from "./tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Your profile, security and household members." />
      <SettingsTabs />
      <div className="mt-6">{children}</div>
    </>
  );
}
