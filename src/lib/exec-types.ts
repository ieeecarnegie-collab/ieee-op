export type ExecMember = {
  id: string;
  name: string;
  email: string;
  committees: string[];
};

export function memberCommitteeLabel(member: ExecMember): string {
  if (member.committees.length === 0) return "";
  return member.committees
    .map((slug) => slug.replace(/-/g, " "))
    .join(", ");
}
