export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { preparerStockage } = await import("./lib/ressources/demarrage");
    await preparerStockage();
    const { assurerSuperAdmins } = await import("./lib/super-admin");
    // Base injoignable (pendant un build, par exemple) : le serveur démarre quand même.
    await assurerSuperAdmins().catch((error) => console.error("Super admins non vérifiés :", error));
    const { reprendrePhotosSansLigne } = await import("./lib/galerie");
    await reprendrePhotosSansLigne().catch((error) => console.error("Photos de la galerie non reprises :", error));
  }
}
