import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InternalLayout } from "@/components/InternalLayout";
import { SearchClient } from "./SearchClient";

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <InternalLayout>
      <SearchClient />
    </InternalLayout>
  );
}
