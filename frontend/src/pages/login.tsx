import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../utils/api"

export default function LoginPage() {
    const navigate = useNavigate()

    const [data, setData] = useState({
        email: "",
        password: "",
    })

    async function login() {
        let response = await api.post('/login', JSON.stringify(data))
        const responseData = JSON.parse(response.data)

        localStorage.setItem('token', responseData.token)
        navigate('/add-post')
    }

    return (
        <div className="max-w-[400px] mx-auto mt-10">
            <h3 className="text-2xl font-black">Login</h3>

            <div className="mb-2 flex flex-col">
                <label>Email</label>
                <input
                    type="email"
                    className="py-2 px-4 border"
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                />
            </div>
            <div className="mb-2 flex flex-col">
                <label>Password</label>
                <input
                    type="password"
                    className="py-2 px-4 border"
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                />
            </div>
            <button className="py-2 px-4 bg-blue-600 text-white" onClick={login}>Login</button>
        </div>
    )
}