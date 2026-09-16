import { redirect } from "next/navigation";

/** La raiz del panel no tiene pantalla propia: entra directo al dashboard. */
export default function Home() {
  redirect("/dashboard");
}
