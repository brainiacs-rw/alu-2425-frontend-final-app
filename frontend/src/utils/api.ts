import { Axios } from "axios";


export const api = new Axios({
    baseURL: "http://localhost:3000",
    headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
        'Content-Type': 'application/json'
    }
})