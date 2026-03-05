'use client';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">AuraBank</h1>
        <nav>
          <a href="/" className="mx-2 hover:underline">Dashboard</a>
          <a href="http://localhost:3000/vest" className="mx-2 hover:underline">PayneVest</a>
          <a href="http://localhost:3000/wallet" className="mx-2 hover:underline">PayneWallet</a>
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.href = '/';
            }}
            className="ml-4 bg-white text-purple-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
