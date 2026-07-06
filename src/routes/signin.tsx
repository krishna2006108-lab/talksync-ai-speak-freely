import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/talksync/auth-view";
import "./auth.css";

const searchSchema = z.object({
  seat: z.coerce.number().int().min(1).max(10).optional(),
});

export const Route = createFileRoute("/signin")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — TalkSync AI" },
      {
        name: "description",
        content: "Sign in to TalkSync AI and jump into a live translated meeting room.",
      },
      { property: "og:title", content: "Sign in — TalkSync AI" },
      { property: "og:description", content: "Real-time speech translation for teams." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { seat } = Route.useSearch();
  return <AuthView mode="signin" seat={seat} />;
}
