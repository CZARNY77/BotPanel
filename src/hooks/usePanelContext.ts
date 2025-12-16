import { useOutletContext } from "react-router-dom";
import { PanelOutletContext } from "../layouts/PanelLayout";

export function usePanelContext() {
  return useOutletContext<PanelOutletContext>();
}
