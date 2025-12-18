import { useState} from 'react'
import {Link } from 'react-router-dom'

export default function Password(){
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")


    const [loading, setLoading] = useState(false)

    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch("http://localhost:5000/password",{
                method : "PUT",
                headers: {"Content-type" : "application/json"},
                body: JSON.stringify({email, password})
            })
            const data = await response.json()
            if(response.ok){
                setSuccess("Sikeres jelszóváltozatatás")
                setEmail("")
                setPass("")
            } else {
                setError(data.message || "Hiba történt!")
            }
        } catch (error) {
            console.log(error)
            setError(error.message)
        } finally{
            setLoading(false)
        }
    }
    return(
        <>
            <div className="form-container">
                <form onSubmit={handleUpdatePassword} className="form-box">
                    {success && <p className="msg success">{success}</p>}
    
                    <div className="form-group">
                        <label>Email</label>
                        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Írja be az email-címét!' required/>
                    </div>
 
                    <div className="form-group">
                        <label>Új Jelszó</label>
                        <input type="password" value={password} onChange={(e) => setPass(e.target.value)} placeholder='Írja be a új jelszavát!' required/>
                    </div>
                    <button type='submit' disabled={loading} className="btn-submit">
                        {loading ? "Jelszóváltozatás folyamatban..." : "Jelszóváltoztatás"}
                    </button>
                    <p><Link to={"/login"}>Visszatérek a bejelentkezés oldalra</Link></p>
                    {error && <p className="msg error">{error}</p>}
                </form>
            </div>
        </>
    )    
}