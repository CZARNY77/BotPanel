import React from "react";

export const LoadingScreen: React.FC<{ label?: string }> = ({ label }) => (
  <div className="loading-screen">
    <div className="spinner" />
    <p>{label ?? "Loading..."}</p>
  </div>
);
