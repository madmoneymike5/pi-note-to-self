import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Feature Spec #1 foundation: an intentionally empty factory. It proves the
// Pi runtime load boundary without registering commands, tools, widgets,
// flags, event behavior, persistence, or background resources. Later feature
// specifications add behavior here.
export default function (_pi: ExtensionAPI) {}
