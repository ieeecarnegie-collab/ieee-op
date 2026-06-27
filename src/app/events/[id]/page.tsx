import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { InternalLayout } from "@/components/InternalLayout";
import { EventDetailClient } from "./EventDetailClient";
import { getEventById } from "@/lib/events";
import { canEdit } from "@/lib/permissions";
import { getExpensesForEvent } from "@/lib/expenses";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posterRequested?: string; roomBookingRequested?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { posterRequested, roomBookingRequested } = await searchParams;
  const data = await getEventById(id);
  if (!data?.committee) notFound();

  const expenses = await getExpensesForEvent(id);

  return (
    <InternalLayout>
      <EventDetailClient
        event={data.event}
        committeeSlug={data.committee.slug}
        committeeName={data.committee.name}
        checklist={data.checklist}
        poster={data.poster ? { id: data.poster.id, status: data.poster.status } : null}
        roomBooking={
          data.roomBooking
            ? { id: data.roomBooking.id, status: data.roomBooking.status }
            : null
        }
        canEdit={canEdit(session.user, data.committee.slug)}
        posterJustRequested={posterRequested === "1"}
        roomBookingJustRequested={roomBookingRequested === "1"}
        expenses={expenses}
      />
    </InternalLayout>
  );
}
