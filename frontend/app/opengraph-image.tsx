import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Recourse: chargebacks for the agent economy on GenLayer";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#001320",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 64,
              background: "#45d7ff",
              borderRadius: 7,
              display: "flex",
            }}
          />
          <span style={{ fontSize: 30, letterSpacing: 6, color: "#bcd5df" }}>
            RE·COURSE
          </span>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Your agent paid. The service lied.</span>
          <span style={{ color: "#45d7ff" }}>Get the units back.</span>
        </div>
        <div style={{ fontSize: 30, color: "#bcd5df", marginTop: 40, display: "flex" }}>
          Post-payment disputes settled by a GenLayer validator jury · on-chain in about a minute
        </div>
      </div>
    ),
    size,
  );
}
