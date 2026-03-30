export default function DemoModeBanner() {
  const isDemo =
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!isDemo) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(37, 99, 235, 0.95)",
        color: "white",
        textAlign: "center",
        padding: "10px 16px",
        fontSize: "14px",
        fontWeight: 500,
        backdropFilter: "blur(8px)",
        letterSpacing: "0.01em",
      }}
    >
      🔒 Demo Mode — changes are not saved. This is a portfolio preview.
    </div>
  );
}
