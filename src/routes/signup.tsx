import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/talksync/auth-view";
import "./auth.css";

const searchSchema = z.object({
  seat: z.coerce.number().int().min(1).max(10).optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Create your account — TalkSync AI" },
      {
        name: "description",
        content: "Create your TalkSync AI account to lock in a founding seat and start free.",
      },
      { property: "og:title", content: "Create your account — TalkSync AI" },
      { property: "og:description", content: "A room in every language, in one click." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const { seat } = Route.useSearch();
  return <AuthView mode="signup" seat={seat} />;
}
