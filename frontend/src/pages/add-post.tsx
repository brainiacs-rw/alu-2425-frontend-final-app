import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../utils/api"

export default function AddPost() {
    const navigate = useNavigate()

    const [data, setData] = useState({
        title: "",
        description: "",
        photo: "",
        body: "",
    })

    async function addpost() {
        let response = await api.post('/posts', JSON.stringify(data))
        if (response.status == 201) {
            navigate('/')
        }
    }

    return (
        <div className="max-w-[400px] mx-auto mt-10">
            <h3 className="text-2xl font-black">Add post</h3>

            <div className="mb-2 flex flex-col">
                <label>Title</label>
                <input
                    type="email"
                    className="py-2 px-4 border"
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                />
            </div>
            <div className="mb-2 flex flex-col">
                <label>Description</label>
                <input
                    type="text"
                    className="py-2 px-4 border"
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                />
            </div>
            <div className="mb-2 flex flex-col">
                <label>Photo</label>
                <input
                    type="text"
                    className="py-2 px-4 border"
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                />
            </div>
            <div className="mb-2 flex flex-col">
                <label>Body</label>
                <textarea
                    className="py-2 px-4 border"
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                />
            </div>
            <button className="py-2 px-4 bg-blue-600 text-white" onClick={addpost}>Add post</button>
        </div>
    )
}