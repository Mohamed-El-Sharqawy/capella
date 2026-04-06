"use client";

import { useState } from "react";

export function useOrderNote() {
  const [orderNote, setOrderNote] = useState("");

  return {
    orderNote,
    setOrderNote,
  };
}
