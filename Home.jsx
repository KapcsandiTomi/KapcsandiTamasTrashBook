import { Link } from "react-router-dom"

export default function Home({ isLoggedIn }) {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!isLoggedIn) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <h1 className="text-4xl font-bold mb-4">Nem vagy bejelentkezve!</h1>
                    <p className="text-lg">Kérlek, jelentkezz be, hogy hozzáférhess a tartalmakhoz 🌟</p>
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-green-400 to-blue-500 text-white">
            <h1 className="text-5xl font-extrabold mb-4">Üdvözlünk, {user?.username}!</h1>

            {user && user.role === "admin" && (
                <Link to="/admin" className="mt-4 px-4 py-2 bg-yellow-400 text-black rounded">
                    Admin Felület
                </Link>
            )}
        </div>
    );
}
