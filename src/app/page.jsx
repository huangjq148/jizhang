import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/auth.mjs";
import HomeClient from "../components/HomeClient";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <HomeClient username={user.username} />;
}
