import { handleEdgeTutor } from "../../../src/lib/edge-tutor.ts";
Deno.serve((request) => handleEdgeTutor(request, Deno.env.toObject()));
