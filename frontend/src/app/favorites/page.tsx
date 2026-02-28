import FavoritesClient from "./FavoritesClient";

export const metadata = {
  title: "Favorites • SurfSeer",
};

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="glass soft-shadow rounded-3xl p-8 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Favorites
        </h1>
        <p className="mt-2 text-sm text-white/70 leading-6">
          Your saved spots for quick access.
        </p>

        <div className="mt-8">
          <FavoritesClient />
        </div>
      </div>
    </main>
  );
}