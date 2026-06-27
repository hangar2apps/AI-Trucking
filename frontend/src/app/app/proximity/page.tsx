import { redirect } from "next/navigation";

export default function ProximityRedirectPage() {
  redirect("/app/intelligence?tab=map");
}
