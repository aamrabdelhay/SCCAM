import { SectionPage } from "@/components/SectionPage";

export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SectionPage slug="laws" searchParams={searchParams} />;
}
