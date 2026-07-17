import { setupServer } from "msw/node";
import { frankfurterHandlers } from "./handlers/frankfurterApi";

export const server = setupServer(...frankfurterHandlers);
