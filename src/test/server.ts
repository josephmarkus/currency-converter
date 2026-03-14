import { setupServer } from "msw/node";
import { workerApiHandlers } from "./handlers/workerApi";
import { frankfurterHandlers } from "./handlers/frankfurterApi";

export const server = setupServer(...workerApiHandlers, ...frankfurterHandlers);
