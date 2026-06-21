import type { ExtractedBrd } from "@/lib/types";

export const INIT_PASTE = "I need to create simple ABC bank application with login credential. it should automatically create bank application and run with different port";

export const ABC_EXTRACTED: ExtractedBrd = {
  reqCount: 8,
  riskCount: 3,
  ports: [
    { port: "3001", label: "Instance 1 – Primary",   cmd: "PORT=3001 node server.js" },
    { port: "3002", label: "Instance 2 – Secondary", cmd: "PORT=3002 node server.js" },
    { port: "3000", label: "Dev Default",             cmd: "PORT=3000 node server.js" },
  ],
  requirements: [
    { id: "FR-001", text: "User registration with username & password",                    pri: "must"   },
    { id: "FR-002", text: "Login with credential validation (JWT)",                        pri: "must"   },
    { id: "FR-003", text: "Clear error message on invalid login",                          pri: "must"   },
    { id: "FR-004", text: "View account balance when authenticated",                       pri: "must"   },
    { id: "FR-005", text: "Auto-generate runnable bank app scaffold",                      pri: "must"   },
    { id: "FR-006", text: "Configurable port via PORT environment variable",               pri: "must"   },
    { id: "FR-007", text: "Multiple instances running on different ports simultaneously",  pri: "should" },
    { id: "FR-008", text: "Admin view: all accounts & transaction history",                pri: "should" },
  ],
  stakeholders: ["Product Owner", "Engineering Lead", "QA Lead"],
};
