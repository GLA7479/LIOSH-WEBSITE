import React from "react";
import { ParentCopilotPanel } from "./parent-copilot-panel.jsx";

/**
 * @param {{ payload: object; selectedContextRef?: object | null }} props
 */
export default function ParentCopilotShell({ payload, selectedContextRef = null }) {
  if (!payload) return null;
  return (
    <div className="min-h-0 flex flex-col">
      <ParentCopilotPanel payload={payload} selectedContextRef={selectedContextRef} />
    </div>
  );
}
