import type { Metadata } from "next";
import Login from "@/app/ui/login";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to ErgMaster"
};
export default function Page() {
  return <Login />;
}