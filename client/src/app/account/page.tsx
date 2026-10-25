import { ContentLayout } from "@/components/admin-panel/content-layout";
import { AccountProfileView } from "./AccountProfileView";

export default function AccountPage() {
  return (
    <ContentLayout title="Account">
      <AccountProfileView />
    </ContentLayout>
  );
}
