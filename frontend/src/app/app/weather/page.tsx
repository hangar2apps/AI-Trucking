import { redirect } from "next/navigation";

export default function WeatherRedirectPage() {
  redirect("/app/intelligence?tab=weather");
}
