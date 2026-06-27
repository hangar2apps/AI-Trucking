import { redirect } from "next/navigation";

export default function RoutesRedirectPage() {
  redirect("/app/intelligence?tab=routes");
}
