import React from "react";
import { ParentCopilotPanel } from "./parent-copilot-panel.jsx";

/**
 * @param {{
 *   payload: object;
 *   selectedContextRef?: object | null;
 *   asyncTurnRunner?: ((input: object) => Promise<any>) | null;
 * }} props
 */
export default function ParentCopilotShell({ payload, selectedContextRef = null, asyncTurnRunner = null }) {
  if (!payload) return null;
  return (
    <div className="w-full min-h-0 flex flex-col">
      <ParentCopilotPanel
        payload={payload}
        selectedContextRef={selectedContextRef}
        asyncTurnRunner={asyncTurnRunner}
      />
    </div>
  );
}
