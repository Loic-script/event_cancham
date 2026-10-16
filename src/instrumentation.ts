export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { preparerStockage } = await import("./lib/ressources/demarrage");
    await preparerStockage();
  }
}
